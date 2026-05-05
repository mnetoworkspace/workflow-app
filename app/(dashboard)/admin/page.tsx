import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPanel from '@/components/admin/AdminPanel'
import { Shield } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const [{ data: members }, { data: allBadges }, { data: badgeTypes }] = await Promise.all([
    supabase.from('profiles').select('*').order('name'),
    supabase.from('badges').select('*'),
    supabase.from('badge_types').select('*').order('created_at'),
  ])

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#b44bff]" style={{ filter: 'drop-shadow(0 0 8px #b44bff)' }} />
          Admin
        </h1>
        <p className="text-[#6666aa] text-sm mt-1">Gerencie o time, pontos, badges e convites</p>
      </div>

      <AdminPanel
        members={members ?? []}
        allBadges={allBadges ?? []}
        badgeTypes={badgeTypes ?? []}
        currentUserId={user.id}
      />
    </div>
  )
}
