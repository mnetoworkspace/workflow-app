import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return null
  return user
}

export async function GET(request: Request) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('pontos_historico')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ historico: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { userId, pontos, motivo } = await request.json()
  if (!userId || pontos === undefined || !motivo) {
    return NextResponse.json({ error: 'Campos obrigatórios: userId, pontos, motivo' }, { status: 400 })
  }

  const admin = await createAdminClient()

  await admin.from('pontos_historico').insert({ user_id: userId, pontos, motivo: `[Admin] ${motivo}` })
  await admin.rpc('increment_pontos', { uid: userId, amount: pontos })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  const admin = await createAdminClient()
  await admin.from('profiles').update({ pontos: 0, streak: 0 }).eq('id', userId)
  await admin.from('pontos_historico').delete().eq('user_id', userId)

  return NextResponse.json({ success: true })
}
