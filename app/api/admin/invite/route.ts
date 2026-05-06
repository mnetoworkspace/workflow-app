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

async function generateInviteLink(admin: Awaited<ReturnType<typeof createAdminClient>>, email: string, meta: Record<string, unknown>, origin: string) {
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      data: meta,
      redirectTo: `${origin}/set-password`,
    },
  })
  if (error) return { link: null, error: error.message }
  return { link: (data as { properties?: { action_link?: string } }).properties?.action_link ?? null, error: null }
}

// GET — lista convites pendentes
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

// POST — criar convite e tentar enviar email; sempre retorna o link
export async function POST(request: Request) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { email, name, cargo } = await request.json()
  if (!email || !name) return NextResponse.json({ error: 'Email e nome são obrigatórios' }, { status: 400 })

  const admin  = await createAdminClient()
  const origin = request.headers.get('origin') ?? 'http://localhost:3000'
  const meta   = { name, cargo: cargo || null, role: 'collaborator' }

  // Gera o link de convite (sempre funciona, não depende de SMTP)
  const { link, error: linkError } = await generateInviteLink(admin, email, meta, origin)
  if (linkError) return NextResponse.json({ error: linkError }, { status: 400 })

  // Tenta enviar email — falha silenciosamente se SMTP não estiver configurado
  let emailSent = false
  try {
    const RESEND_KEY = process.env.RESEND_API_KEY
    if (RESEND_KEY && link) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:    'TaskDay <onboarding@resend.dev>',
          to:      [email],
          subject: `${name}, você foi convidado para o TaskDay`,
          html:    buildInviteEmail(name, link),
        }),
      })
      emailSent = res.ok
    }
  } catch { /* ignora erro de email */ }

  return NextResponse.json({ success: true, link, emailSent })
}

// PUT — gerar novo link para convite pendente
export async function PUT(request: Request) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })

  const admin  = await createAdminClient()
  const origin = request.headers.get('origin') ?? 'http://localhost:3000'

  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existing = list?.users.find(u => u.email === email)
  const meta = existing?.user_metadata ?? {}

  const { link, error } = await generateInviteLink(admin, email, meta, origin)
  if (error) return NextResponse.json({ error }, { status: 400 })

  // Tenta enviar email
  let emailSent = false
  try {
    const RESEND_KEY = process.env.RESEND_API_KEY
    const name = (meta.name as string) ?? email
    if (RESEND_KEY && link) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:    'TaskDay <onboarding@resend.dev>',
          to:      [email],
          subject: `${name}, seu convite para o TaskDay`,
          html:    buildInviteEmail(name, link),
        }),
      })
      emailSent = res.ok
    }
  } catch { /* ignora */ }

  return NextResponse.json({ success: true, link, emailSent })
}

function buildInviteEmail(name: string, link: string) {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#05050f;color:#fff;border-radius:16px;padding:32px;border:1px solid rgba(0,240,255,0.15)">
      <h1 style="color:#00f0ff;font-size:24px;margin:0 0 4px">TASKDAY</h1>
      <p style="color:#6666aa;font-size:12px;margin:0 0 24px">Squad Raiz · Sistema de Dailies</p>
      <p style="color:#fff;font-size:16px">Olá, <strong>${name}</strong>!</p>
      <p style="color:#8888aa">Você foi convidado para o TaskDay. Clique no botão abaixo para definir sua senha e começar.</p>
      <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#00f0ff;color:#05050f;font-weight:700;border-radius:8px;text-decoration:none;font-size:14px">
        Definir senha e entrar
      </a>
      <p style="color:#333355;font-size:12px">O link expira em 24 horas. Se não foi você, ignore este email.</p>
    </div>
  `
}
