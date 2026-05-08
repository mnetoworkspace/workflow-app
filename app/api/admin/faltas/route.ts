import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return null
  return { user, supabase }
}

// POST — registra falta
export async function POST(request: Request) {
  const ctx = await assertAdmin()
  if (!ctx) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { userId, data: date } = await request.json()
  if (!userId || !date) return NextResponse.json({ error: 'userId e data são obrigatórios' }, { status: 400 })

  const { data, error } = await ctx.supabase
    .from('faltas')
    .insert({ user_id: userId, data: date, created_by: ctx.user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, id: data.id })
}

// DELETE — remove falta
export async function DELETE(request: Request) {
  const ctx = await assertAdmin()
  if (!ctx) return NextResponse.json({ error: 'Apenas admin' }, { status: 403 })

  const { faltaId } = await request.json()
  if (!faltaId) return NextResponse.json({ error: 'faltaId obrigatório' }, { status: 400 })

  const { error } = await ctx.supabase.from('faltas').delete().eq('id', faltaId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
