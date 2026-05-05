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

export async function PATCH(request: Request) {
  const currentUser = await assertAdmin()
  if (!currentUser) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { userId, name, cargo, role } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })
  if (name !== undefined && !name?.trim()) return NextResponse.json({ error: 'Nome não pode ser vazio' }, { status: 400 })

  const updates: Record<string, string | null> = {}
  if (name !== undefined) updates.name = name.trim()
  if (cargo !== undefined) updates.cargo = cargo?.trim() || null
  if (role === 'admin' || role === 'collaborator') updates.role = role

  const admin = await createAdminClient()
  const { error } = await admin.from('profiles').update(updates).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const currentUser = await assertAdmin()
  if (!currentUser) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })
  if (userId === currentUser.id) return NextResponse.json({ error: 'Você não pode remover você mesmo' }, { status: 400 })

  const admin = await createAdminClient()
  // Delete profile first (safety for non-cascade setups)
  await admin.from('profiles').delete().eq('id', userId)
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
