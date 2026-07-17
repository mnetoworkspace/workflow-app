import { Task, getPontosTask, COMPLEXIDADE_COLORS } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle2, Clock, XCircle, ArrowRight, ListChecks } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const STATUS_ICON = {
  concluida:    { icon: CheckCircle2, color: '#00ff88' },
  em_andamento: { icon: Clock,        color: '#00f0ff' },
  cancelada:    { icon: XCircle,      color: '#ff0055' },
  postergada:   { icon: ArrowRight,   color: '#ff8800' },
}

// Histórico de tudo que o time fez (e está fazendo) para este cliente,
// agrupado por dia — a prestação de contas do serviço.
export default function ClienteAtividades({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="neon-card rounded-2xl border border-white/[0.06] p-10 text-center">
        <ListChecks className="h-6 w-6 text-[#6666aa] mx-auto mb-2" />
        <p className="text-sm text-[#8888aa]">Nenhuma atividade registrada para este cliente ainda.</p>
        <p className="text-xs text-[#444466] mt-1">Vincule tasks da daily a este cliente e elas aparecem aqui.</p>
      </div>
    )
  }

  const concluidas = tasks.filter(t => t.status === 'concluida')
  const emAberto = tasks.filter(t => t.status === 'em_andamento')
  const membros = new Set(tasks.map(t => t.user_id)).size

  // Agrupa por dia (tasks já vêm ordenadas por data desc)
  const porDia = new Map<string, Task[]>()
  for (const t of tasks) {
    const grupo = porDia.get(t.data)
    if (grupo) grupo.push(t)
    else porDia.set(t.data, [t])
  }

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { valor: tasks.length, label: 'atividades', color: '#00f0ff' },
          { valor: concluidas.length, label: 'concluídas', color: '#00ff88' },
          { valor: membros, label: membros === 1 ? 'membro envolvido' : 'membros envolvidos', color: '#b44bff' },
        ].map(s => (
          <div key={s.label} className="neon-card rounded-xl border border-white/[0.06] p-3 text-center">
            <p className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.valor}</p>
            <p className="text-[10px] text-[#6666aa]">{s.label}</p>
          </div>
        ))}
      </div>

      {emAberto.length > 0 && (
        <p className="text-[11px] text-[#ff8800]">
          ⚠️ {emAberto.length} atividade{emAberto.length === 1 ? '' : 's'} ainda em aberto para este cliente
        </p>
      )}

      {/* Timeline por dia */}
      {[...porDia.entries()].map(([dia, doDia]) => (
        <div key={dia} className="neon-card rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.02]">
            <p className="text-[10px] font-semibold text-[#8888bb] uppercase tracking-wider capitalize">
              {format(parseISO(dia), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <ul className="p-3 space-y-2">
            {doDia.map(task => {
              const s = STATUS_ICON[task.status]
              const Icon = s.icon
              const initials = task.profile?.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? '?'
              return (
                <li key={task.id} className="flex items-center gap-2.5">
                  <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: s.color }} />
                  <span className={cn(
                    'text-xs flex-1 min-w-0 truncate',
                    task.status === 'concluida' ? 'text-[#8888aa]' : 'text-[#c8c8e8]',
                    task.status === 'cancelada' && 'line-through text-[#444466]',
                  )}>
                    {task.titulo}
                  </span>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border shrink-0"
                    style={{
                      color: COMPLEXIDADE_COLORS[task.complexidade ?? 'media'],
                      borderColor: `${COMPLEXIDADE_COLORS[task.complexidade ?? 'media']}35`,
                    }}
                  >
                    +{getPontosTask(task)}
                  </span>
                  {task.profile && (
                    <span className="flex items-center gap-1.5 shrink-0" title={task.profile.name}>
                      <Avatar className="h-5 w-5">
                        {task.profile.avatar_url && <AvatarImage src={task.profile.avatar_url} alt={task.profile.name} />}
                        <AvatarFallback className="bg-[#0a0a20] text-[#00f0ff] text-[8px] font-bold">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-[10px] text-[#6666aa] hidden sm:inline">{task.profile.name.split(' ')[0]}</span>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
