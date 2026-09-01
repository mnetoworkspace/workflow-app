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
  const currentUser = await assertAdmin()
  if (!currentUser) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'email obrigatório' }, { status: 400 })

  const admin = await createAdminClient()
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${new URL(request.url).origin}/set-password` },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ link: data.properties.action_link })
}
