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

// POST — cria usuário diretamente com senha definida pelo admin
export async function POST(request: Request) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { email, name, cargo, password } = await request.json()
  if (!email || !name || !password) {
    return NextResponse.json({ error: 'Email, nome e senha são obrigatórios' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, cargo: cargo || null, role: 'collaborator' },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, userId: data.user.id })
}

// DELETE — remove usuário pendente
export async function DELETE(request: Request) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })
  if (userId === user.id) return NextResponse.json({ error: 'Não pode remover você mesmo' }, { status: 400 })

  const admin = await createAdminClient()
  await admin.from('profiles').delete().eq('id', userId)
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}
