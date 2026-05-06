import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Record<string, string> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admins podem convidar' }, { status: 403 })
  }

  const { email, name, cargo } = await request.json()

  if (!email || !name) {
    return NextResponse.json({ error: 'Email e nome são obrigatórios' }, { status: 400 })
  }

  const admin = await createAdminClient()

  const origin = request.headers.get('origin') ?? request.headers.get('referer')?.replace(/\/[^/]*$/, '') ?? 'http://localhost:3000'

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name, cargo: cargo || null, role: 'collaborator' },
    redirectTo: `${origin}/login`,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, userId: data.user.id })
}
