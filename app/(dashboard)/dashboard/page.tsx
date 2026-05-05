import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import TaskList from '@/components/tasks/TaskList'
import AddTaskForm from '@/components/tasks/AddTaskForm'
import ImpedimentoCard from '@/components/tasks/ImpedimentoCard'
import StatsBar from '@/components/gamification/StatsBar'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = format(new Date(), 'yyyy-MM-dd')

  const [{ data: profile }, { data: tasks }, { data: impedimento }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('data', today)
      .order('created_at', { ascending: true }),
    supabase
      .from('impedimentos')
      .select('*')
      .eq('user_id', user.id)
      .eq('data', today)
      .maybeSingle(),
  ])

  if (!profile) redirect('/login')

  const dataFormatada = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white capitalize">
          Olá, {profile.name.split(' ')[0]} 👋
        </h1>
        <p className="text-zinc-400 text-sm mt-1 capitalize">{dataFormatada}</p>
      </div>

      <StatsBar profile={profile} />

      <div className="mt-6 space-y-6">
        <AddTaskForm userId={user.id} date={today} />
        <TaskList tasks={tasks ?? []} userId={user.id} />
        <ImpedimentoCard impedimento={impedimento} userId={user.id} date={today} />
      </div>
    </div>
  )
}
