import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { History } from 'lucide-react'
import DailyBoard from '@/components/daily/DailyBoard'

export default async function DailyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')

  const [
    { data: currentProfile },
    { data: profiles },
    { data: todayTasks },
    { data: yesterdayTasks },
    { data: impedimentos },
    { data: faltas },
    { data: badges },
    { data: badgeTypes },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('profiles').select('*').order('name'),
    supabase.from('tasks').select('*, profile:profiles(*)').eq('data', today),
    supabase.from('tasks').select('*, profile:profiles(*)').eq('data', yesterday),
    supabase.from('impedimentos').select('*, profile:profiles(*)').eq('data', today),
    supabase.from('faltas').select('*').eq('data', today),
    supabase.from('badges').select('*'),
    supabase.from('badge_types').select('*'),
  ])

  if (!currentProfile) redirect('/login')

  const dataFormatada = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 md:mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Daily <span className="text-[#6666aa] font-normal">—</span>{' '}
              <span style={{ background: 'linear-gradient(90deg,#b44bff,#00f0ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Squad Raiz
              </span>
            </h1>
            <p className="text-[#6666aa] text-sm mt-1 capitalize">{dataFormatada}</p>
          </div>
          <Link
            href="/daily/historico"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#6666aa] border border-white/[0.07] hover:text-white hover:border-white/[0.15] hover:bg-white/[0.04] transition-all"
          >
            <History className="h-3.5 w-3.5" />
            Histórico
          </Link>
        </div>
      </div>

      <DailyBoard
        profiles={profiles ?? []}
        todayTasks={todayTasks ?? []}
        yesterdayTasks={yesterdayTasks ?? []}
        impedimentos={impedimentos ?? []}
        faltas={faltas ?? []}
        badges={badges ?? []}
        badgeTypes={badgeTypes ?? []}
        currentProfile={currentProfile}
        today={today}
        yesterday={yesterday}
      />
    </div>
  )
}
