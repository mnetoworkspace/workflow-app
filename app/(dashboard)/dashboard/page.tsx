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

  const [{ data: profile }, { data: tasks }, { data: pendencias }, { data: impedimento }, { data: clientes }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('tasks')
      .select('*, cliente:clientes(*)')
      .eq('user_id', user.id)
      .eq('data', today)
      .order('created_at', { ascending: true }),
    // Missões de dias anteriores ainda em aberto — ficam na aba até serem resolvidas
    supabase
      .from('tasks')
      .select('*, cliente:clientes(*)')
      .eq('user_id', user.id)
      .eq('status', 'em_andamento')
      .lt('data', today)
      .order('data', { ascending: true }),
    supabase
      .from('impedimentos')
      .select('*')
      .eq('user_id', user.id)
      .eq('data', today)
      .maybeSingle(),
    supabase.from('clientes').select('*').eq('status', 'ativo').order('nome'),
  ])

  if (!profile) redirect('/login')

  const dataFormatada = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold capitalize">
          <span className="text-white">Olá, </span>
          <span style={{ background: 'linear-gradient(90deg, #6ff203, #c3f601)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {profile.name.split(' ')[0]}
          </span>
          <span className="text-white"> 👋</span>
        </h1>
        <p className="text-[#6666aa] text-sm mt-1 capitalize">{dataFormatada}</p>
      </div>

      <StatsBar profile={profile} />

      <div className="mt-6 space-y-6">
        <AddTaskForm userId={user.id} date={today} clientes={clientes ?? []} />
        <TaskList
          tasks={pendencias ?? []}
          userId={user.id}
          label="⚠️ Missões pendentes de dias anteriores"
          emptyHidden
        />
        <TaskList tasks={tasks ?? []} userId={user.id} label="Missões de hoje" />
        <ImpedimentoCard impedimento={impedimento} userId={user.id} date={today} />
      </div>
    </div>
  )
}
