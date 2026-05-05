import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { userId, tipo } = await request.json()
  if (!userId || !tipo) return NextResponse.json({ error: 'userId e tipo obrigatórios' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await admin.from('badges').insert({ user_id: userId, tipo })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { userId, tipo } = await request.json()
  if (!userId || !tipo) return NextResponse.json({ error: 'userId e tipo obrigatórios' }, { status: 400 })

  const admin = await createAdminClient()
  await admin.from('badges').delete().eq('user_id', userId).eq('tipo', tipo)

  return NextResponse.json({ success: true })
}
