import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PONTOS } from '@/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { entregaId } = await request.json()
  if (!entregaId) return NextResponse.json({ error: 'entregaId obrigatório' }, { status: 400 })

  const admin = await createAdminClient()

  const { data: entrega, error: fetchError } = await admin
    .from('entregas')
    .select('*, projeto:projetos(nome, cliente:clientes(nome))')
    .eq('id', entregaId)
    .single()

  if (fetchError || !entrega) return NextResponse.json({ error: 'Entrega não encontrada' }, { status: 404 })

  const agora = new Date()
  const jaPontuada = entrega.entregue_em !== null

  const { error: updateError } = await admin
    .from('entregas')
    .update({ status: 'entregue', ...(jaPontuada ? {} : { entregue_em: agora.toISOString() }) })
    .eq('id', entregaId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })

  // Idempotente: se já foi entregue antes (entregue_em preenchido), não pontua de novo
  if (jaPontuada) {
    return NextResponse.json({ success: true, mensagem: 'Entrega concluída!' })
  }

  // Pontos vão para o responsável; sem responsável, para quem concluiu
  const beneficiario = entrega.responsavel_id ?? user.id
  const noPrazo = !!entrega.prazo && agora.toISOString().slice(0, 10) <= entrega.prazo
  const total = PONTOS.ENTREGA_CONCLUIDA + (noPrazo ? PONTOS.BONUS_ENTREGA_NO_PRAZO : 0)

  await admin.rpc('increment_pontos', { uid: beneficiario, amount: total })
  await admin.from('pontos_historico').insert([
    { user_id: beneficiario, pontos: PONTOS.ENTREGA_CONCLUIDA, motivo: `Entrega concluída: ${entrega.titulo}` },
    ...(noPrazo ? [{ user_id: beneficiario, pontos: PONTOS.BONUS_ENTREGA_NO_PRAZO, motivo: 'Bônus: entrega no prazo' }] : []),
  ])

  // Badges de produção (checagem simples por contagem)
  const { data: entreguesDoUser } = await admin
    .from('entregas')
    .select('prazo, entregue_em')
    .eq('responsavel_id', beneficiario)
    .eq('status', 'entregue')
    .not('entregue_em', 'is', null)

  const todas = entreguesDoUser ?? []
  const noPrazoCount = todas.filter(e => e.prazo && e.entregue_em && e.entregue_em.slice(0, 10) <= e.prazo).length

  if (todas.length >= 10) {
    await admin.from('badges').upsert(
      { user_id: beneficiario, tipo: 'entregador' },
      { onConflict: 'user_id,tipo', ignoreDuplicates: true }
    )
  }
  if (noPrazoCount >= 10) {
    await admin.from('badges').upsert(
      { user_id: beneficiario, tipo: 'no_prazo' },
      { onConflict: 'user_id,tipo', ignoreDuplicates: true }
    )
  }

  return NextResponse.json({
    success: true,
    mensagem: noPrazo
      ? `Entrega concluída no prazo! +${total} pts 🎉`
      : `Entrega concluída! +${total} pts 🎉`,
  })
}
