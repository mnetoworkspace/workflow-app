import { Cliente, ClienteContato, Projeto, Entrega, Task, PROJETO_TIPO_LABELS } from '@/types'
import { Phone, Mail, Star, FolderKanban, Package, CheckCircle2, StickyNote, ListTodo } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const TASK_STATUS_COLORS: Record<Task['status'], string> = {
  em_andamento: '#00f0ff',
  concluida: '#00ff88',
  cancelada: '#ff0055',
  postergada: '#ff8800',
}

export default function ClienteVisaoGeral({
  cliente,
  contatos,
  projetos,
  entregas,
  tasksRecentes = [],
}: {
  cliente: Cliente
  contatos: ClienteContato[]
  projetos: Projeto[]
  entregas: Entrega[]
  tasksRecentes?: Task[]
}) {
  const projetosAtivos = projetos.filter(p => p.status === 'ativo')
  const emProducao = entregas.filter(e => e.status === 'em_producao' || e.status === 'revisao')
  const entreguesTotal = entregas.filter(e => e.status === 'entregue')
  const contatosPrincipais = contatos.filter(c => c.principal)
  const servicosRecorrentes = projetosAtivos.filter(p => p.tipo === 'recorrente')

  const stats = [
    { label: 'Projetos ativos', valor: projetosAtivos.length, icon: FolderKanban, color: '#00f0ff' },
    { label: 'Em produção', valor: emProducao.length, icon: Package, color: '#b44bff' },
    { label: 'Entregues', valor: entreguesTotal.length, icon: CheckCircle2, color: '#00ff88' },
  ]

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ label, valor, icon: Icon, color }) => (
          <div key={label} className="neon-card rounded-2xl border border-white/[0.06] p-4 text-center">
            <Icon className="h-4 w-4 mx-auto mb-1.5" style={{ color }} />
            <p className="text-xl font-bold text-white">{valor}</p>
            <p className="text-[10px] text-[#6666aa] uppercase tracking-wider mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Serviços contratados (projetos recorrentes ativos) */}
      {servicosRecorrentes.length > 0 && (
        <div className="neon-card rounded-2xl border border-white/[0.06] p-5">
          <p className="text-[10px] font-semibold text-[#00f0ff] uppercase tracking-wider mb-3 flex items-center gap-2">
            <FolderKanban className="h-3.5 w-3.5" /> Serviços contratados
          </p>
          <div className="flex flex-wrap gap-2">
            {servicosRecorrentes.map(p => (
              <span key={p.id} className="text-xs px-3 py-1.5 rounded-full border border-[#00f0ff]/25 bg-[#00f0ff]/[0.06] text-[#00f0ff]">
                {p.nome} · {PROJETO_TIPO_LABELS[p.tipo]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Contatos principais */}
      {contatosPrincipais.length > 0 && (
        <div className="neon-card rounded-2xl border border-white/[0.06] p-5">
          <p className="text-[10px] font-semibold text-[#ff8800] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Star className="h-3.5 w-3.5" /> Contatos principais
          </p>
          <div className="space-y-2">
            {contatosPrincipais.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="text-white font-medium">{c.nome}{c.cargo ? <span className="text-[#6666aa] font-normal"> · {c.cargo}</span> : null}</span>
                <span className="flex items-center gap-3 shrink-0">
                  {c.telefone && (
                    <a href={`https://wa.me/55${c.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[#00ff88] hover:underline text-[11px] inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {c.telefone}
                    </a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="text-[#00f0ff] hover:underline text-[11px] inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {c.email}
                    </a>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observações */}
      {cliente.observacoes && (
        <div className="neon-card rounded-2xl border border-white/[0.06] p-5">
          <p className="text-[10px] font-semibold text-[#b44bff] uppercase tracking-wider mb-2 flex items-center gap-2">
            <StickyNote className="h-3.5 w-3.5" /> Observações
          </p>
          <p className="text-sm text-[#aaaacc] whitespace-pre-wrap">{cliente.observacoes}</p>
        </div>
      )}

      {/* Tarefas recentes da daily vinculadas a este cliente */}
      {tasksRecentes.length > 0 && (
        <div className="neon-card rounded-2xl border border-white/[0.06] p-5">
          <p className="text-[10px] font-semibold text-[#00f0ff] uppercase tracking-wider mb-3 flex items-center gap-2">
            <ListTodo className="h-3.5 w-3.5" /> Atividade recente da daily
          </p>
          <div className="space-y-1.5">
            {tasksRecentes.map(task => (
              <div key={task.id} className="flex items-center gap-2.5 text-xs">
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: TASK_STATUS_COLORS[task.status], boxShadow: `0 0 4px ${TASK_STATUS_COLORS[task.status]}` }}
                />
                <span className={`flex-1 truncate ${task.status === 'concluida' ? 'text-[#444466] line-through' : 'text-[#aaaacc]'}`}>
                  {task.titulo}
                </span>
                <span className="text-[10px] text-[#6666aa] shrink-0">
                  {task.profile?.name.split(' ')[0]} · {format(parseISO(task.data), 'dd MMM', { locale: ptBR })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
