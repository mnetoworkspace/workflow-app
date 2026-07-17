import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PONTOS } from '@/types'

// Encerra o dia: concede bônus da daily e atualiza streaks.
// Idempotente via daily_fechamentos (um fechamento por data).
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const dia: string = body.data ?? new Date().toISOString().slice(0, 10)

  const admin = await createAdminClient()

  const { data: jaFechado } = await admin.from('daily_fechamentos').select('data').eq('data', dia).maybeSingle()
  if (jaFechado) return NextResponse.json({ error: 'Este dia já foi encerrado' }, { status: 409 })

  const [{ data: profiles }, { data: tasksDoDia }, { data: faltasDoDia }] = await Promise.all([
    admin.from('profiles').select('id, name, streak, recorde_streak'),
    admin.from('tasks').select('id, user_id, status').eq('data', dia),
    admin.from('faltas').select('user_id').eq('data', dia),
  ])

  const faltosos = new Set((faltasDoDia ?? []).map(f => f.user_id))
  const historico: { user_id: string; pontos: number; motivo: string }[] = []
  const resumo: { nome: string; pontos: number; streak: number }[] = []

  for (const p of profiles ?? []) {
    const tarefas = (tasksDoDia ?? []).filter(t => t.user_id === p.id)
    const faltou = faltosos.has(p.id)
    const participou = !faltou && tarefas.length > 0

    let pontos = 0
    if (participou) {
      pontos += PONTOS.PARTICIPOU_DAILY
      historico.push({ user_id: p.id, pontos: PONTOS.PARTICIPOU_DAILY, motivo: `Participou da daily de ${dia}` })

      const concluidas = tarefas.filter(t => t.status === 'concluida').length
      if (concluidas === tarefas.length) {
        pontos += PONTOS.BONUS_TODAS_CONCLUIDAS
        historico.push({ user_id: p.id, pontos: PONTOS.BONUS_TODAS_CONCLUIDAS, motivo: `Bônus: todas as missões do dia concluídas (${dia})` })
      }
      if (!tarefas.some(t => t.status === 'postergada')) {
        pontos += PONTOS.ZERO_POSTERGADAS
        historico.push({ user_id: p.id, pontos: PONTOS.ZERO_POSTERGADAS, motivo: `Bônus: zero postergadas (${dia})` })
      }
    }

    // Streak: participou → +1; faltou → zera; sem tasks e sem falta → mantém
    let novoStreak = p.streak
    if (participou) novoStreak = p.streak + 1
    else if (faltou) novoStreak = 0

    if (pontos > 0 || novoStreak !== p.streak) {
      await admin.from('profiles').update({
        streak: novoStreak,
        recorde_streak: Math.max(p.recorde_streak ?? 0, novoStreak),
      }).eq('id', p.id)
      if (pontos > 0) await admin.rpc('increment_pontos', { uid: p.id, amount: pontos })
    }

    resumo.push({ nome: p.name, pontos, streak: novoStreak })
  }

  if (historico.length > 0) await admin.from('pontos_historico').insert(historico)
  await admin.from('daily_fechamentos').insert({ data: dia, fechado_por: user.id })

  return NextResponse.json({ success: true, dia, resumo })
}
