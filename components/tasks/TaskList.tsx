'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task, TaskStatus, Cliente, getPontosTask, COMPLEXIDADE_LABELS, COMPLEXIDADE_COLORS } from '@/types'
import {
  CheckCircle2, Clock, XCircle, ArrowRight, Trash2, RotateCcw,
  Pencil, Check, X, Calendar, Clock3, Building2, Square, CheckSquare, ListChecks,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { format, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'

const STATUS = {
  em_andamento: { label: 'Em andamento', icon: Clock,        color: '#00f0ff', dotClass: 'bg-[#00f0ff]' },
  concluida:    { label: 'Concluída',    icon: CheckCircle2, color: '#00ff88', dotClass: 'bg-[#00ff88]' },
  cancelada:    { label: 'Cancelada',    icon: XCircle,      color: '#ff0055', dotClass: 'bg-[#ff0055]' },
  postergada:   { label: 'Postergada',   icon: ArrowRight,   color: '#ff8800', dotClass: 'bg-[#ff8800]' },
}

// ── Bottom sheet com detalhes da task ─────────────────────────────────────────
function TaskSheet({ task: initialTask, onClose, userId, isAdmin, clientes = [] }: {
  task: Task
  onClose: () => void
  userId: string
  isAdmin?: boolean
  clientes?: Cliente[]
}) {
  const [task, setTask]           = useState(initialTask)
  const [loading, setLoading]     = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput]     = useState(initialTask.titulo)
  const [editingCliente, setEditingCliente] = useState(false)
  const router  = useRouter()
  const supabase = createClient()
  const canEdit  = task.user_id === userId || isAdmin
  const s        = STATUS[task.status]

  async function updateStatus(newStatus: TaskStatus) {
    if (newStatus === task.status || loading) return
    setLoading(true)
    const updates: Partial<Task> = { status: newStatus }
    const pts = getPontosTask(task)

    if (newStatus === 'concluida') {
      updates.concluida_em = new Date().toISOString()
      await supabase.from('pontos_historico').insert({ user_id: task.user_id, pontos: pts, motivo: `Tarefa concluída: ${task.titulo}` })
      await supabase.rpc('increment_pontos', { uid: task.user_id, amount: pts })
    }
    if (newStatus === 'em_andamento' && task.status === 'concluida') {
      updates.concluida_em = null
      await supabase.from('pontos_historico').insert({ user_id: task.user_id, pontos: -pts, motivo: `Tarefa reaberta: ${task.titulo}` })
      await supabase.rpc('increment_pontos', { uid: task.user_id, amount: -pts })
    }
    if (newStatus === 'postergada') {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await supabase.from('tasks').insert({
        user_id: task.user_id, titulo: task.titulo, data: format(tomorrow, 'yyyy-MM-dd'), status: 'em_andamento',
        complexidade: task.complexidade, cliente_id: task.cliente_id, entrega_id: task.entrega_id, origem_task_id: task.id,
      })
    }

    const { error } = await supabase.from('tasks').update(updates).eq('id', task.id)
    if (error) { toast.error('Erro ao atualizar'); setLoading(false); return }

    const msgs: Record<TaskStatus, string> = { concluida: `✅ +${pts} pts`, cancelada: 'Cancelada', postergada: '⏳ Para amanhã', em_andamento: 'Reaberta' }
    toast.success(msgs[newStatus])
    setTask(prev => ({ ...prev, ...updates }))
    router.refresh()
    setLoading(false)
  }

  async function saveTitle() {
    const trimmed = titleInput.trim()
    if (!trimmed) { setEditingTitle(false); setTitleInput(task.titulo); return }
    if (trimmed === task.titulo) { setEditingTitle(false); return }
    setLoading(true)
    const { error } = await supabase.from('tasks').update({ titulo: trimmed }).eq('id', task.id)
    if (!error) { setTask(prev => ({ ...prev, titulo: trimmed })); router.refresh() }
    else toast.error('Erro ao salvar')
    setLoading(false)
    setEditingTitle(false)
  }

  async function deleteTask() {
    setLoading(true)
    await supabase.from('tasks').delete().eq('id', task.id)
    toast.success('Tarefa removida')
    router.refresh()
    onClose()
  }

  async function saveCliente(clienteId: string) {
    if (clienteId === (task.cliente_id ?? '')) { setEditingCliente(false); return }
    setLoading(true)
    // Ao trocar de cliente a entrega vinculada não é mais válida
    const { error } = await supabase
      .from('tasks')
      .update({ cliente_id: clienteId || null, entrega_id: null })
      .eq('id', task.id)
    if (!error) {
      const novoCliente = clientes.find(c => c.id === clienteId) ?? null
      setTask(prev => ({ ...prev, cliente_id: clienteId || null, cliente: novoCliente ?? undefined, entrega_id: null }))
      router.refresh()
    } else {
      toast.error('Erro ao salvar')
    }
    setLoading(false)
    setEditingCliente(false)
  }

  const formattedData    = format(parseISO(task.data), "d 'de' MMMM", { locale: ptBR })
  const formattedCreated = format(parseISO(task.created_at), "d MMM 'às' HH:mm", { locale: ptBR })
  const formattedDone    = task.concluida_em ? format(parseISO(task.concluida_em), "d MMM 'às' HH:mm", { locale: ptBR }) : null

  return (
    <motion.div
      className="fixed inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-[#08081c] border-t border-white/10 rounded-t-2xl max-h-[88vh] overflow-y-auto"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-white/15" />
        </div>

        <div className="px-5 pb-2 pt-1">
          {/* Status chip */}
          <div className="flex items-center gap-2 mb-4">
            <div className={cn('h-2 w-2 rounded-full shrink-0', s.dotClass)} style={{ boxShadow: `0 0 6px ${s.color}` }} />
            <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full border', `status-${task.status}`)}>
              {s.label}
            </span>
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-full border"
              style={{
                color: COMPLEXIDADE_COLORS[task.complexidade ?? 'media'],
                borderColor: `${COMPLEXIDADE_COLORS[task.complexidade ?? 'media']}40`,
                background: `${COMPLEXIDADE_COLORS[task.complexidade ?? 'media']}10`,
              }}
            >
              {COMPLEXIDADE_LABELS[task.complexidade ?? 'media']} · {getPontosTask(task)} pts
            </span>
          </div>

          {/* Title */}
          {editingTitle ? (
            <div className="flex items-start gap-2 mb-5">
              <Input
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                className="neon-input text-sm flex-1"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') saveTitle()
                  if (e.key === 'Escape') { setEditingTitle(false); setTitleInput(task.titulo) }
                }}
              />
              <button onClick={saveTitle} className="h-9 w-9 flex items-center justify-center rounded-lg text-[#00ff88] hover:bg-[#00ff88]/10 transition-colors shrink-0">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => { setEditingTitle(false); setTitleInput(task.titulo) }} className="h-9 w-9 flex items-center justify-center rounded-lg text-[#444466] hover:text-white transition-colors shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-start gap-2 mb-5">
              <h2 className={cn(
                'text-base font-medium leading-snug flex-1',
                task.status === 'concluida' ? 'line-through text-[#444466]' : 'text-white',
                task.status === 'cancelada' && 'line-through text-[#333355]',
              )}>
                {task.titulo}
              </h2>
              {canEdit && (
                <button
                  onClick={() => setEditingTitle(true)}
                  className="h-7 w-7 flex items-center justify-center rounded text-[#333355] hover:text-[#b44bff] transition-colors shrink-0 mt-0.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-2 mb-5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="flex items-center gap-2.5 text-xs text-[#6666aa]">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {editingCliente ? (
                <select
                  autoFocus
                  defaultValue={task.cliente_id ?? ''}
                  disabled={loading}
                  onChange={e => saveCliente(e.target.value)}
                  onBlur={() => setEditingCliente(false)}
                  className="neon-input h-7 text-xs rounded-md px-2 bg-transparent flex-1 max-w-[220px]"
                >
                  <option value="" className="bg-[#0a0a22]">🏠 Interno</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#0a0a22]">{c.nome}</option>
                  ))}
                </select>
              ) : (
                <button
                  type="button"
                  onClick={() => canEdit && setEditingCliente(true)}
                  disabled={!canEdit}
                  className="flex-1 text-left disabled:cursor-default"
                >
                  {task.cliente
                    ? <span>Cliente: <span className="text-[#ff0080] font-medium">{task.cliente.nome}</span></span>
                    : <span>Atividade <span className="text-[#8888bb]">interna</span></span>}
                  {canEdit && <Pencil className="h-2.5 w-2.5 inline-block ml-1.5 text-[#333355]" />}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#6666aa]">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>Agendado para <span className="text-[#8888bb]">{formattedData}</span></span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#6666aa]">
              <Clock3 className="h-3.5 w-3.5 shrink-0" />
              <span>Criado em <span className="text-[#8888bb]">{formattedCreated}</span></span>
            </div>
            {formattedDone && (
              <div className="flex items-center gap-2.5 text-xs text-[#00ff88]/80">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Concluído em <span className="text-[#00ff88]">{formattedDone}</span></span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {canEdit && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {task.status !== 'concluida' && (
                <button
                  onClick={() => updateStatus('concluida')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 text-sm font-medium hover:bg-[#00ff88]/20 transition-colors disabled:opacity-40"
                >
                  <CheckCircle2 className="h-4 w-4" /> Concluir
                </button>
              )}
              {task.status !== 'em_andamento' && (
                <button
                  onClick={() => updateStatus('em_andamento')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 text-sm font-medium hover:bg-[#00f0ff]/20 transition-colors disabled:opacity-40"
                >
                  <RotateCcw className="h-4 w-4" /> Reabrir
                </button>
              )}
              {task.status === 'em_andamento' && (
                <button
                  onClick={() => updateStatus('postergada')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#ff8800]/10 text-[#ff8800] border border-[#ff8800]/30 text-sm font-medium hover:bg-[#ff8800]/20 transition-colors disabled:opacity-40"
                >
                  <ArrowRight className="h-4 w-4" /> Postergar
                </button>
              )}
              {task.status === 'em_andamento' && (
                <button
                  onClick={() => updateStatus('cancelada')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#ff0055]/10 text-[#ff0055] border border-[#ff0055]/30 text-sm font-medium hover:bg-[#ff0055]/20 transition-colors disabled:opacity-40"
                >
                  <XCircle className="h-4 w-4" /> Cancelar
                </button>
              )}
            </div>
          )}

          {/* Delete */}
          {canEdit && (
            <button
              onClick={deleteTask}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[#444466] border border-white/[0.06] hover:text-[#ff0055] hover:border-[#ff0055]/20 hover:bg-[#ff0055]/05 text-sm transition-colors disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" /> Remover tarefa
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Task row ──────────────────────────────────────────────────────────────────
function TaskItem({ task, userId, isAdmin, onOpen, selectMode, isSelected, onToggleSelect }: {
  task: Task
  userId: string
  isAdmin?: boolean
  onOpen: () => void
  selectMode?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
}) {
  const [loading, setLoading] = useState(false)
  const router   = useRouter()
  const supabase = createClient()
  const s        = STATUS[task.status]
  const Icon     = s.icon
  const canEdit  = task.user_id === userId || isAdmin

  async function updateStatus(newStatus: TaskStatus) {
    setLoading(true)
    const updates: Partial<Task> = { status: newStatus }
    const pts = getPontosTask(task)

    if (newStatus === 'concluida') {
      updates.concluida_em = new Date().toISOString()
      await supabase.from('pontos_historico').insert({ user_id: task.user_id, pontos: pts, motivo: `Tarefa concluída: ${task.titulo}` })
      await supabase.rpc('increment_pontos', { uid: task.user_id, amount: pts })
    }
    if (newStatus === 'em_andamento' && task.status === 'concluida') {
      updates.concluida_em = null
      await supabase.from('pontos_historico').insert({ user_id: task.user_id, pontos: -pts, motivo: `Tarefa reaberta: ${task.titulo}` })
      await supabase.rpc('increment_pontos', { uid: task.user_id, amount: -pts })
    }
    if (newStatus === 'postergada') {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await supabase.from('tasks').insert({
        user_id: task.user_id, titulo: task.titulo, data: format(tomorrow, 'yyyy-MM-dd'), status: 'em_andamento',
        complexidade: task.complexidade, cliente_id: task.cliente_id, entrega_id: task.entrega_id, origem_task_id: task.id,
      })
    }

    const { error } = await supabase.from('tasks').update(updates).eq('id', task.id)
    if (error) { toast.error('Erro ao atualizar') }
    else {
      const msgs: Record<TaskStatus, string> = { concluida: `✅ +${pts} pts`, cancelada: 'Cancelada', postergada: '⏳ Para amanhã', em_andamento: 'Reaberta' }
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
        isSelected && 'border-[#00ff88]/40 bg-[#00ff88]/[0.05]',
        loading && 'pointer-events-none',
      )}
    >
      {/* Checkbox — modo seleção em massa */}
      {selectMode && (
        <button
          onClick={canEdit ? onToggleSelect : undefined}
          disabled={!canEdit}
          className="shrink-0 disabled:opacity-30"
        >
          {isSelected
            ? <CheckSquare className="h-4 w-4 text-[#00ff88]" />
            : <Square className="h-4 w-4 text-[#444466]" />}
        </button>
      )}

      {/* Status dot */}
      <div className="relative shrink-0">
        <div className={cn('h-2 w-2 rounded-full', s.dotClass)} style={{ boxShadow: `0 0 6px ${s.color}` }} />
        {task.status === 'em_andamento' && (
          <div className={cn('absolute inset-0 rounded-full animate-ping', s.dotClass)} style={{ opacity: 0.4 }} />
        )}
      </div>

      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: s.color }} />

      {/* Clickable title area → seleciona (modo massa) ou abre o sheet */}
      <button
        onClick={selectMode ? (canEdit ? onToggleSelect : undefined) : onOpen}
        className="flex-1 text-left min-w-0"
      >
        <span className={cn(
          'text-sm block truncate',
          task.status === 'concluida' ? 'line-through text-[#444466]' : 'text-[#c8c8e8]',
          task.status === 'cancelada' && 'line-through text-[#333355]',
        )}>
          {task.titulo}
        </span>
        <span className={cn(
          'text-[9px] font-semibold uppercase tracking-wider block truncate',
          task.cliente ? 'text-[#ff0080]' : 'text-[#333355]',
        )}>
          {task.cliente ? task.cliente.nome : 'interno'}
        </span>
      </button>

      {/* Task antiga ainda pendente → mostra a data de origem */}
      {task.status === 'em_andamento' && task.data < format(new Date(), 'yyyy-MM-dd') && (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#ff8800]/10 text-[#ff8800] border border-[#ff8800]/20 shrink-0 font-mono">
          {format(parseISO(task.data), 'dd/MM')}
        </span>
      )}

      <span
        className="text-[9px] px-1.5 py-0.5 rounded-full border font-mono shrink-0 hidden sm:inline"
        style={{
          color: COMPLEXIDADE_COLORS[task.complexidade ?? 'media'],
          borderColor: `${COMPLEXIDADE_COLORS[task.complexidade ?? 'media']}35`,
        }}
      >
        +{getPontosTask(task)}
      </span>

      <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 hidden sm:inline', `status-${task.status}`)}>
        {s.label}
      </span>

      {canEdit && !selectMode && task.status === 'em_andamento' && (
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

      {canEdit && !selectMode && task.status !== 'em_andamento' && (
        <div className="flex gap-0.5 shrink-0 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <button onClick={() => updateStatus('em_andamento')} className="h-7 w-7 flex items-center justify-center rounded text-[#6666aa] hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 transition-colors" title="Reabrir tarefa">
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

// ── TaskList ──────────────────────────────────────────────────────────────────
export default function TaskList({ tasks, userId, isAdmin, label = 'Tarefas', emptyHidden, clientes = [] }: {
  tasks: Task[]
  userId: string
  isAdmin?: boolean
  label?: string
  emptyHidden?: boolean
  clientes?: Cliente[]
}) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const editaveis = tasks.filter(t => t.user_id === userId || isAdmin)

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function exitSelect() {
    setSelectMode(false)
    setSelected(new Set())
  }

  async function bulkAction(action: 'concluir' | 'postergar' | 'cancelar' | 'remover') {
    const chosen = tasks.filter(t => selected.has(t.id))
    if (chosen.length === 0 || bulkLoading) return
    if (action === 'remover' && !confirm(`Remover ${chosen.length} tarefa(s)? Isso não pode ser desfeito.`)) return
    setBulkLoading(true)

    if (action === 'remover') {
      const { error } = await supabase.from('tasks').delete().in('id', chosen.map(t => t.id))
      if (error) toast.error('Erro ao remover')
      else toast.success(`${chosen.length} tarefa(s) removida(s)`)
    }

    if (action === 'concluir') {
      const alvo = chosen.filter(t => t.status !== 'concluida')
      if (alvo.length > 0) {
        const { error } = await supabase
          .from('tasks')
          .update({ status: 'concluida', concluida_em: new Date().toISOString() })
          .in('id', alvo.map(t => t.id))
        if (error) toast.error('Erro ao concluir')
        else {
          await supabase.from('pontos_historico').insert(
            alvo.map(t => ({ user_id: t.user_id, pontos: getPontosTask(t), motivo: `Tarefa concluída: ${t.titulo}` }))
          )
          const porUser = new Map<string, number>()
          for (const t of alvo) porUser.set(t.user_id, (porUser.get(t.user_id) ?? 0) + getPontosTask(t))
          for (const [uid, amount] of porUser) await supabase.rpc('increment_pontos', { uid, amount })
          const total = alvo.reduce((s, t) => s + getPontosTask(t), 0)
          toast.success(`✅ ${alvo.length} concluída(s) · +${total} pts`)
        }
      }
    }

    if (action === 'cancelar') {
      const alvo = chosen.filter(t => t.status === 'em_andamento')
      if (alvo.length > 0) {
        const { error } = await supabase.from('tasks').update({ status: 'cancelada' }).in('id', alvo.map(t => t.id))
        if (error) toast.error('Erro ao cancelar')
        else toast.success(`${alvo.length} cancelada(s)`)
      }
    }

    if (action === 'postergar') {
      const alvo = chosen.filter(t => t.status === 'em_andamento')
      if (alvo.length > 0) {
        const amanha = format(addDays(new Date(), 1), 'yyyy-MM-dd')
        await supabase.from('tasks').insert(
          alvo.map(t => ({
            user_id: t.user_id, titulo: t.titulo, data: amanha, status: 'em_andamento',
            complexidade: t.complexidade, cliente_id: t.cliente_id, entrega_id: t.entrega_id, origem_task_id: t.id,
          }))
        )
        const { error } = await supabase.from('tasks').update({ status: 'postergada' }).in('id', alvo.map(t => t.id))
        if (error) toast.error('Erro ao postergar')
        else toast.success(`⏳ ${alvo.length} para amanhã`)
      }
    }

    exitSelect()
    router.refresh()
    setBulkLoading(false)
  }

  if (tasks.length === 0) {
    if (emptyHidden) return null
    return (
      <div className="text-center py-10">
        <p className="text-[#333355] text-sm">Nenhuma tarefa ainda</p>
        <p className="text-[#222244] text-xs mt-1">Adicione suas atividades acima ☝️</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-[#444466] uppercase tracking-wider">
            {label} ({tasks.length})
          </p>
          {editaveis.length > 0 && (
            <button
              onClick={() => selectMode ? exitSelect() : setSelectMode(true)}
              className={cn(
                'flex items-center gap-1 text-[10px] font-medium transition-colors',
                selectMode ? 'text-[#00ff88]' : 'text-[#333355] hover:text-[#00ff88]',
              )}
            >
              <ListChecks className="h-3 w-3" />
              {selectMode ? 'Cancelar seleção' : 'Selecionar'}
            </button>
          )}
        </div>
        <AnimatePresence mode="popLayout">
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              userId={userId}
              isAdmin={isAdmin}
              onOpen={() => setSelectedTask(task)}
              selectMode={selectMode}
              isSelected={selected.has(task.id)}
              onToggleSelect={() => toggleSelect(task.id)}
            />
          ))}
        </AnimatePresence>

        {/* Barra de ações em massa */}
        {selectMode && (
          <div className="flex items-center gap-2 flex-wrap mt-3 p-2.5 rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/[0.04]">
            <button
              onClick={() => setSelected(
                selected.size === editaveis.length
                  ? new Set()
                  : new Set(editaveis.map(t => t.id))
              )}
              className="text-[10px] font-medium text-[#8888bb] hover:text-white transition-colors"
            >
              {selected.size === editaveis.length ? 'Nenhuma' : 'Todas'}
            </button>
            <span className="text-[10px] text-[#6666aa]">{selected.size} selecionada(s)</span>
            <div className="ml-auto flex gap-1 flex-wrap">
              <button
                onClick={() => bulkAction('concluir')}
                disabled={selected.size === 0 || bulkLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-[#00ff88] border border-[#00ff88]/30 bg-[#00ff88]/10 hover:bg-[#00ff88]/20 transition-colors disabled:opacity-40"
              >
                <CheckCircle2 className="h-3 w-3" /> Concluir
              </button>
              <button
                onClick={() => bulkAction('postergar')}
                disabled={selected.size === 0 || bulkLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-[#ff8800] border border-[#ff8800]/30 bg-[#ff8800]/10 hover:bg-[#ff8800]/20 transition-colors disabled:opacity-40"
              >
                <ArrowRight className="h-3 w-3" /> Postergar
              </button>
              <button
                onClick={() => bulkAction('cancelar')}
                disabled={selected.size === 0 || bulkLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-[#ff0055] border border-[#ff0055]/30 bg-[#ff0055]/10 hover:bg-[#ff0055]/20 transition-colors disabled:opacity-40"
              >
                <XCircle className="h-3 w-3" /> Cancelar
              </button>
              <button
                onClick={() => bulkAction('remover')}
                disabled={selected.size === 0 || bulkLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium text-[#6666aa] border border-white/[0.08] hover:text-[#ff0055] hover:border-[#ff0055]/30 transition-colors disabled:opacity-40"
              >
                <Trash2 className="h-3 w-3" /> Remover
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedTask && (
          <TaskSheet
            key={selectedTask.id}
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            userId={userId}
            isAdmin={isAdmin}
            clientes={clientes}
          />
        )}
      </AnimatePresence>
    </>
  )
}
