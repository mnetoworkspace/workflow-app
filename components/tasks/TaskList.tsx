'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task, TaskStatus, PONTOS } from '@/types'
import { CheckCircle2, Clock, XCircle, ArrowRight, Trash2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const STATUS = {
  em_andamento: { label: 'Em andamento', icon: Clock,         color: '#00f0ff', dotClass: 'bg-[#00f0ff]' },
  concluida:    { label: 'Concluída',    icon: CheckCircle2,  color: '#00ff88', dotClass: 'bg-[#00ff88]' },
  cancelada:    { label: 'Cancelada',    icon: XCircle,       color: '#ff0055', dotClass: 'bg-[#ff0055]' },
  postergada:   { label: 'Postergada',   icon: ArrowRight,    color: '#ff8800', dotClass: 'bg-[#ff8800]' },
}

function TaskItem({ task, userId, isAdmin }: { task: Task; userId: string; isAdmin?: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const s = STATUS[task.status]
  const Icon = s.icon
  const canEdit = task.user_id === userId || isAdmin

  async function updateStatus(newStatus: TaskStatus) {
    setLoading(true)
    const updates: Partial<Task> = { status: newStatus }

    if (newStatus === 'concluida') {
      updates.concluida_em = new Date().toISOString()
      await supabase.from('pontos_historico').insert({ user_id: task.user_id, pontos: PONTOS.TAREFA_CONCLUIDA, motivo: `Tarefa concluída: ${task.titulo}` })
      await supabase.rpc('increment_pontos', { uid: task.user_id, amount: PONTOS.TAREFA_CONCLUIDA })
    }
    if (newStatus === 'em_andamento' && task.status === 'concluida') {
      updates.concluida_em = null
      await supabase.from('pontos_historico').insert({ user_id: task.user_id, pontos: -PONTOS.TAREFA_CONCLUIDA, motivo: `Tarefa reaberta: ${task.titulo}` })
      await supabase.rpc('increment_pontos', { uid: task.user_id, amount: -PONTOS.TAREFA_CONCLUIDA })
    }
    if (newStatus === 'postergada') {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await supabase.from('tasks').insert({ user_id: task.user_id, titulo: task.titulo, data: format(tomorrow, 'yyyy-MM-dd'), status: 'em_andamento', origem_task_id: task.id })
    }

    const { error } = await supabase.from('tasks').update(updates).eq('id', task.id)
    if (error) { toast.error('Erro ao atualizar') }
    else {
      const msgs: Record<TaskStatus, string> = { concluida: '✅ +10 pts', cancelada: 'Cancelada', postergada: '⏳ Para amanhã', em_andamento: 'Reaberta' }
      toast.success(msgs[newStatus])
      router.refresh()
    }
    setLoading(false)
  }

  async function deleteTask() {
    setLoading(true)
    await supabase.from('tasks').delete().eq('id', task.id)
    toast.success('Removida')
    router.refresh()
    setLoading(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: loading ? 0.5 : 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-200',
        'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]',
        loading && 'pointer-events-none'
      )}
    >
      {/* Status dot */}
      <div className="relative shrink-0">
        <div className={cn('h-2 w-2 rounded-full', s.dotClass)} style={{ boxShadow: `0 0 6px ${s.color}` }} />
        {task.status === 'em_andamento' && (
          <div className={cn('absolute inset-0 rounded-full animate-ping', s.dotClass)} style={{ opacity: 0.4 }} />
        )}
      </div>

      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: s.color }} />

      <span className={cn(
        'flex-1 text-sm truncate',
        task.status === 'concluida' ? 'line-through text-[#444466]' : 'text-[#c8c8e8]',
        task.status === 'cancelada' && 'line-through text-[#333355]'
      )}>
        {task.titulo}
      </span>

      <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 hidden sm:inline', `status-${task.status}`)}>
        {s.label}
      </span>

      {canEdit && task.status === 'em_andamento' && (
        <div className="flex gap-0.5 shrink-0 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <button onClick={() => updateStatus('concluida')} className="h-7 w-7 flex items-center justify-center rounded text-[#00ff88] hover:bg-[#00ff88]/10 transition-colors" title="Concluir">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => updateStatus('postergada')} className="h-7 w-7 flex items-center justify-center rounded text-[#ff8800] hover:bg-[#ff8800]/10 transition-colors" title="Postergar">
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => updateStatus('cancelada')} className="h-7 w-7 flex items-center justify-center rounded text-[#ff0055] hover:bg-[#ff0055]/10 transition-colors" title="Cancelar">
            <XCircle className="h-3.5 w-3.5" />
          </button>
          <button onClick={deleteTask} className="h-7 w-7 flex items-center justify-center rounded text-[#333355] hover:text-[#6666aa] transition-colors" title="Remover">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {canEdit && task.status !== 'em_andamento' && (
        <div className="flex gap-0.5 shrink-0 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <button
            onClick={() => updateStatus('em_andamento')}
            className="h-7 w-7 flex items-center justify-center rounded text-[#6666aa] hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 transition-colors"
            title="Reabrir tarefa"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button onClick={deleteTask} className="h-7 w-7 flex items-center justify-center rounded text-[#333355] hover:text-[#6666aa] transition-colors" title="Remover">
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </motion.div>
  )
}

export default function TaskList({ tasks, userId, isAdmin }: { tasks: Task[]; userId: string; isAdmin?: boolean }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-[#333355] text-sm">Nenhuma tarefa ainda</p>
        <p className="text-[#222244] text-xs mt-1">Adicione suas atividades acima ☝️</p>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold text-[#444466] uppercase tracking-wider mb-2">
        Tarefas ({tasks.length})
      </p>
      <AnimatePresence mode="popLayout">
        {tasks.map(task => <TaskItem key={task.id} task={task} userId={userId} isAdmin={isAdmin} />)}
      </AnimatePresence>
    </div>
  )
}
