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

export async function POST(request: Request) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { label, emoji, descricao } = await request.json()
  if (!label?.trim() || !emoji?.trim() || !descricao?.trim()) {
    return NextResponse.json({ error: 'label, emoji e descricao são obrigatórios' }, { status: 400 })
  }

  // gera slug único a partir do label
  const tipo = label.trim()
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    + '_' + Date.now().toString(36)

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('badge_types')
    .insert({ tipo, label: label.trim(), emoji: emoji.trim(), descricao: descricao.trim(), is_custom: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, badgeType: data })
}

export async function DELETE(request: Request) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { tipo } = await request.json()
  if (!tipo) return NextResponse.json({ error: 'tipo obrigatório' }, { status: 400 })

  const admin = await createAdminClient()

  // remove todas as badges desse tipo antes de deletar o tipo
  await admin.from('badges').delete().eq('tipo', tipo)
  const { error } = await admin.from('badge_types').delete().eq('tipo', tipo).eq('is_custom', true)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
