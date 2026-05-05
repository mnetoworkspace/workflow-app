import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileEditor from '@/components/profile/ProfileEditor'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: badges }, { data: historico }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('badges').select('*').eq('user_id', user.id),
    supabase.from('pontos_historico').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(15),
  ])

  if (!profile) redirect('/login')

  return <ProfileEditor profile={profile} badges={badges ?? []} historico={historico ?? []} />
}
