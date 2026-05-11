import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import HistoricoBoard from '@/components/daily/HistoricoBoard'

export default async function HistoricoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: currentProfile },
    { data: profiles },
    { data: taskDates },
    { data: faltaDates },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('profiles').select('*').order('name'),
    supabase.from('tasks').select('data'),
    supabase.from('faltas').select('data'),
  ])

  if (!currentProfile) redirect('/login')

  const markedDates = [...new Set([
    ...(taskDates?.map((t: { data: string }) => t.data) ?? []),
    ...(faltaDates?.map((f: { data: string }) => f.data) ?? []),
  ])] as string[]

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 md:mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/daily"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-[#444466] hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Histórico{' '}
              <span className="text-[#6666aa] font-normal">—</span>{' '}
              <span style={{ background: 'linear-gradient(90deg,#b44bff,#00f0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Squad Raiz
              </span>
            </h1>
            <p className="text-[#6666aa] text-sm mt-1">Dailies anteriores</p>
          </div>
        </div>
      </div>

      <HistoricoBoard
        profiles={profiles ?? []}
        markedDates={markedDates}
        currentProfile={currentProfile}
      />
    </div>
  )
}
