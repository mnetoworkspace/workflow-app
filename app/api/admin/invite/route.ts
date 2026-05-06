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

// GET — lista convites pendentes (usuários que nunca fizeram login)
export async function GET() {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const admin = await createAdminClient()
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const pending = data.users
    .filter(u => !u.last_sign_in_at && u.invited_at)
    .map(u => ({
      id:         u.id,
      email:      u.email,
      name:       u.user_metadata?.name ?? u.email,
      cargo:      u.user_metadata?.cargo ?? null,
      invited_at: u.invited_at,
    }))

  return NextResponse.json({ pending })
}

// POST — enviar novo convite
export async function POST(request: Request) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { email, name, cargo } = await request.json()
  if (!email || !name) return NextResponse.json({ error: 'Email e nome são obrigatórios' }, { status: 400 })

  const admin = await createAdminClient()
  const origin = request.headers.get('origin') ?? 'http://localhost:3000'

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name, cargo: cargo || null, role: 'collaborator' },
    redirectTo: `${origin}/set-password`,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, userId: data.user.id })
}

// PUT — reenviar convite para usuário já existente
export async function PUT(request: Request) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })

  const admin = await createAdminClient()
  const origin = request.headers.get('origin') ?? 'http://localhost:3000'

  // Busca dados do usuário para preservar name/cargo
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existing = list?.users.find(u => u.email === email)
  const meta = existing?.user_metadata ?? {}

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: meta,
    redirectTo: `${origin}/set-password`,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
