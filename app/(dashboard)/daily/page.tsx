import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('profiles').select('*').order('name'),
    supabase.from('tasks').select('*, profile:profiles(*)').eq('data', today),
    supabase.from('tasks').select('*, profile:profiles(*)').eq('data', yesterday),
    supabase.from('impedimentos').select('*, profile:profiles(*)').eq('data', today),
  ])

  if (!currentProfile) redirect('/login')

  const dataFormatada = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Daily — Squad Raiz</h1>
            <p className="text-zinc-400 text-sm mt-1 capitalize">{dataFormatada}</p>
          </div>
        </div>
      </div>

      <DailyBoard
        profiles={profiles ?? []}
        todayTasks={todayTasks ?? []}
        yesterdayTasks={yesterdayTasks ?? []}
        impedimentos={impedimentos ?? []}
        currentProfile={currentProfile}
        today={today}
      />
    </div>
  )
}
