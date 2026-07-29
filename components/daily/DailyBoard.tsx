'use client'

import { useEffect, useState } from 'react'
import { Profile, Task, Impedimento, AvatarFrame, Falta, Badge, BadgeType, Cliente, BADGE_INFO, getPontosTask } from '@/types'
import { format, parseISO } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import {
  CheckCircle2, Clock, XCircle, ArrowRight, AlertTriangle, CheckCircle,
  Plus, Pencil, Check, X, Smile, RotateCcw, CalendarPlus, UserX, UserCheck,
  ArrowUpDown, ChevronUp, ChevronDown,
} from 'lucide-react'
import TaskList from '@/components/tasks/TaskList'
import AddTaskForm from '@/components/tasks/AddTaskForm'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

function frameClass(f: AvatarFrame) { return f && f !== 'none' ? `frame-${f}` : '' }

const FRAME_HEX: Record<string, string> = {
  none: '', cyan: '#00f0ff', purple: '#b44bff',
  green: '#00ff88', pink: '#ff0080', gold: '#ffe600', rainbow: '#b44bff',
}

function StatusIcon({ status }: { status: Task['status'] }) {
  const map = {
    concluida:    <CheckCircle2 className="h-3 w-3 text-[#00ff88]" />,
    em_andamento: <Clock        className="h-3 w-3 text-[#00f0ff]" />,
    cancelada:    <XCircle      className="h-3 w-3 text-[#ff0055]" />,
    postergada:   <ArrowRight   className="h-3 w-3 text-[#ff8800]" />,
  }
  return map[status]
}

// ── Anterior task item com ações inline ──────────────────────────────────────
function AnteriorItem({ task, canEdit, today, yesterday, onUpdate }: {
  task: Task
  canEdit: boolean
  today: string
  yesterday: string
  onUpdate: (id: string, newStatus: Task['status']) => void
}) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function updateStatus(newStatus: Task['status']) {
    setLoading(true)
    const pts = getPontosTask(task)
    if (newStatus === 'concluida') {
      await supabase.from('pontos_historico').insert({ user_id: task.user_id, pontos: pts, motivo: `Tarefa concluída: ${task.titulo}` })
      await supabase.rpc('increment_pontos', { uid: task.user_id, amount: pts })
    }
    if (newStatus === 'em_andamento' && task.status === 'concluida') {
      await supabase.from('pontos_historico').insert({ user_id: task.user_id, pontos: -pts, motivo: `Tarefa reaberta: ${task.titulo}` })
      await supabase.rpc('increment_pontos', { uid: task.user_id, amount: -pts })
    }
    await supabase.from('tasks').update({
      status: newStatus,
      concluida_em: newStatus === 'concluida' ? new Date().toISOString() : null,
    }).eq('id', task.id)
    if (newStatus === 'concluida') toast.success(`✅ +${pts} pts`)
    onUpdate(task.id, newStatus)
    setLoading(false)
  }

  async function trarParaHoje() {
    setLoading(true)
    const { error } = await supabase.from('tasks').insert({
      user_id: task.user_id, titulo: task.titulo, data: today, status: 'em_andamento',
      complexidade: task.complexidade, cliente_id: task.cliente_id, entrega_id: task.entrega_id, origem_task_id: task.id,
    })
    if (!error) toast.success('Tarefa adicionada para hoje!')
    else toast.error('Erro ao trazer tarefa')
    setLoading(false)
  }

  return (
    <li className="group flex items-center gap-2 text-xs">
      <StatusIcon status={task.status} />
      <span className={cn(
        'flex-1 truncate',
        task.status === 'concluida' ? 'text-[#444466] line-through' : 'text-[#8888aa]',
        task.status === 'cancelada' && 'text-[#333355] line-through',
      )}>
        {task.titulo}
        {task.cliente && (
          <span className="text-[#ff0080] ml-1.5 text-[9px] font-semibold uppercase tracking-wider">
            {task.cliente.nome}
          </span>
        )}
      </span>
      {task.status === 'postergada' && (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#ff8800]/10 text-[#ff8800] border border-[#ff8800]/20 shrink-0">
          postergada
        </span>
      )}
      {/* Missão antiga ainda em aberto → mostra desde quando */}
      {task.status === 'em_andamento' && task.data < yesterday && (
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#ff0055]/10 text-[#ff0055] border border-[#ff0055]/20 shrink-0 font-mono">
          desde {format(parseISO(task.data), 'dd/MM')}
        </span>
      )}
      {canEdit && (
        <div className="flex gap-0.5 shrink-0 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          {loading
            ? <span className="h-3.5 w-3.5 rounded-full border border-[#00f0ff] border-t-transparent animate-spin" />
            : task.status === 'em_andamento'
              ? <>
                  <button onClick={() => updateStatus('concluida')} title="Marcar concluída"
                    className="h-5 w-5 flex items-center justify-center rounded text-[#00ff88] hover:bg-[#00ff88]/10 transition-colors">
                    <CheckCircle2 className="h-3 w-3" />
                  </button>
                  <button onClick={trarParaHoje} title="Trazer para hoje"
                    className="h-5 w-5 flex items-center justify-center rounded text-[#00f0ff] hover:bg-[#00f0ff]/10 transition-colors">
                    <CalendarPlus className="h-3 w-3" />
                  </button>
                </>
              : <button onClick={() => updateStatus('em_andamento')} title="Reabrir"
                  className="h-5 w-5 flex items-center justify-center rounded text-[#6666aa] hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 transition-colors">
                  <RotateCcw className="h-3 w-3" />
                </button>
          }
        </div>
      )}
    </li>
  )
}

// ── Card principal de cada membro ────────────────────────────────────────────
function MemberCard({ profile, anteriores, atuais, impedimento, currentProfile, today, yesterday,
  faltou, faltaId, onToggleFalta, memberBadges, badgeInfoMap, clientes }: {
  profile: Profile
  anteriores: Task[]
  atuais: Task[]
  impedimento: Impedimento | null
  currentProfile: Profile
  today: string
  yesterday: string
  faltou: boolean
  faltaId: string | null
  onToggleFalta: (userId: string, faltaId: string | null) => void
  memberBadges: Badge[]
  badgeInfoMap: Record<string, { emoji: string; label: string }>
  clientes: Cliente[]
}) {
  const isOwn   = profile.id === currentProfile.id
  const isAdmin = currentProfile.role === 'admin'
  const canEdit = isOwn || isAdmin

  const initials   = profile.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const concluidas = atuais.filter(t => t.status === 'concluida').length
  const total      = atuais.length
  const pct        = total > 0 ? Math.round((concluidas / total) * 100) : 0

  const [localAnteriores, setLocalAnteriores] = useState<Task[]>(anteriores)
  const [addingAnterior, setAddingAnterior]   = useState(false)
  const [anteriorTitulo, setAnteriorTitulo]   = useState('')
  const [savingAnterior, setSavingAnterior]   = useState(false)
  const [togglingFalta, setTogglingFalta]     = useState(false)

  const [mood, setMood]               = useState(profile.daily_mood ?? '')
  const [editingMood, setEditingMood] = useState(false)
  const [savingMood, setSavingMood]   = useState(false)

  const supabase = createClient()

  function updateAnteriorStatus(id: string, newStatus: Task['status']) {
    setLocalAnteriores(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t))
  }

  async function addAnterior() {
    if (!anteriorTitulo.trim()) return
    setSavingAnterior(true)
    const { data, error } = await supabase
      .from('tasks')
      .insert({ user_id: profile.id, titulo: anteriorTitulo.trim(), data: yesterday, status: 'concluida' })
      .select().single()
    if (error) { toast.error('Erro ao adicionar') }
    else { setLocalAnteriores(prev => [...prev, data as Task]); setAnteriorTitulo(''); setAddingAnterior(false) }
    setSavingAnterior(false)
  }

  async function saveMood() {
    setSavingMood(true)
    await fetch('/api/profile/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daily_mood: mood.trim() || null }),
    })
    setSavingMood(false)
    setEditingMood(false)
  }

  async function toggleFalta() {
    setTogglingFalta(true)
    onToggleFalta(profile.id, faltaId)
    setTogglingFalta(false)
  }

  const frameHex = FRAME_HEX[profile.avatar_frame ?? 'none']
  const cardStyle = faltou
    ? { borderColor: 'rgba(255,0,85,0.35)', boxShadow: '0 0 24px rgba(255,0,85,0.06)' }
    : frameHex
      ? { borderColor: `${frameHex}35`, boxShadow: `0 0 24px ${frameHex}08` }
      : isOwn
        ? { borderColor: 'rgba(0,240,255,0.2)' }
        : { borderColor: 'rgba(255,255,255,0.07)' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: faltou ? 0.65 : 1, y: 0 }}
      className="neon-card rounded-2xl border overflow-hidden"
      style={cardStyle}
    >
      {/* Falta overlay stripe */}
      {faltou && (
        <div className="h-1 bg-gradient-to-r from-[#ff0055]/60 via-[#ff0055]/80 to-[#ff0055]/60" />
      )}

      {/* Banner */}
      {profile.banner_url && !faltou && (
        <div className="relative h-24 overflow-hidden">
          <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#05050f]/20 to-[#05050f]/95" />
        </div>
      )}

      <div className={cn('p-5', profile.banner_url && !faltou && '-mt-8 relative')}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className={cn('h-10 w-10 rounded-full shrink-0', frameClass(profile.avatar_frame))}>
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.name} />}
            <AvatarFallback className="bg-[#0a0a20] text-[#00f0ff] text-sm font-bold">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white text-sm">{profile.name}</h3>
              {isOwn && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20">você</span>}
              {faltou && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ff0055]/15 text-[#ff0055] border border-[#ff0055]/30 font-semibold">
                  FALTOU
                </span>
              )}
            </div>
            {profile.cargo && <p className="text-[11px] text-[#444466]">{profile.cargo}</p>}

            {/* Badge strip */}
            {memberBadges.length > 0 && (
              <div className="flex gap-1 mt-0.5 flex-wrap">
                {memberBadges.slice(0, 5).map(badge => {
                  const info = badgeInfoMap[badge.tipo]
                  if (!info) return null
                  return (
                    <span key={badge.id} title={info.label} className="text-sm leading-none cursor-default">
                      {info.emoji}
                    </span>
                  )
                })}
              </div>
            )}

            {/* Mood */}
            {!faltou && (
              <div className="mt-0.5">
                <AnimatePresence mode="wait">
                  {editingMood ? (
                    <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 mt-1">
                      <Input
                        value={mood} onChange={e => setMood(e.target.value)}
                        placeholder="Frase do dia... ex: 🔥 No modo"
                        className="neon-input h-7 text-xs flex-1" maxLength={60} autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') saveMood(); if (e.key === 'Escape') setEditingMood(false) }}
                      />
                      <button onClick={saveMood} disabled={savingMood}
                        className="flex items-center p-1 rounded text-[#00ff88] hover:bg-[#00ff88]/10 transition-colors disabled:opacity-50">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { setEditingMood(false); setMood(profile.daily_mood ?? '') }}
                        className="flex items-center p-1 rounded text-[#444466] hover:text-white transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ) : mood ? (
                    <motion.div key="show" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 mt-1">
                      <p className="text-[11px] text-[#6666aa] italic truncate">{mood}</p>
                      {isOwn && (
                        <button onClick={() => setEditingMood(true)} className="text-[#333355] hover:text-[#b44bff] transition-colors shrink-0">
                          <Pencil className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </motion.div>
                  ) : isOwn ? (
                    <motion.button key="add-mood" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      onClick={() => setEditingMood(true)}
                      className="flex items-center gap-1 mt-1 text-[10px] text-[#333355] hover:text-[#b44bff] transition-colors">
                      <Smile className="h-3 w-3" /> Adicionar frase do dia
                    </motion.button>
                  ) : null}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {/* Botão falta — admin only, não aparece para si mesmo */}
            {isAdmin && !isOwn && (
              <button
                onClick={toggleFalta}
                disabled={togglingFalta}
                title={faltou ? 'Remover falta' : 'Marcar falta'}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border transition-all disabled:opacity-50',
                  faltou
                    ? 'text-[#00ff88] border-[#00ff88]/30 bg-[#00ff88]/10 hover:bg-[#00ff88]/20'
                    : 'text-[#ff0055]/60 border-[#ff0055]/20 hover:text-[#ff0055] hover:border-[#ff0055]/40 hover:bg-[#ff0055]/08'
                )}
              >
                {faltou ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                {faltou ? 'Presente' : 'Falta'}
              </button>
            )}

            {total > 0 && !faltou && (
              <div className="text-right">
                <span className="text-sm font-bold font-mono text-[#00ff88]">{concluidas}/{total}</span>
                <p className="text-[10px] text-[#444466]">{pct}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Se faltou, encerra o card aqui */}
        {faltou && (
          <p className="text-xs text-[#333355] italic text-center py-4">Ausente nesta daily</p>
        )}

        {!faltou && (
          <>
            {/* Progress bar */}
            {total > 0 && (
              <div className="h-0.5 bg-white/[0.05] rounded-full overflow-hidden mb-4">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#b44bff] to-[#00f0ff]"
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            )}

            <div className="space-y-4">
              {/* Anteriores */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[9px] font-semibold text-[#444466] uppercase tracking-[0.15em]">Atividades Anteriores</p>
                  {canEdit && !addingAnterior && (
                    <button onClick={() => setAddingAnterior(true)}
                      className="flex items-center gap-1 text-[9px] text-[#333355] hover:text-[#00f0ff] transition-colors">
                      <Plus className="h-3 w-3" /> Adicionar
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {addingAnterior && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
                      <div className="flex gap-1.5">
                        <Input
                          value={anteriorTitulo} onChange={e => setAnteriorTitulo(e.target.value)}
                          placeholder="O que foi feito ontem..." className="neon-input h-8 text-xs flex-1" autoFocus
                          onKeyDown={e => { if (e.key === 'Enter') addAnterior(); if (e.key === 'Escape') setAddingAnterior(false) }}
                        />
                        <button onClick={addAnterior} disabled={savingAnterior || !anteriorTitulo.trim()}
                          className="px-2 h-8 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-colors disabled:opacity-40 shrink-0">
                          {savingAnterior ? <span className="h-3 w-3 rounded-full border border-[#00f0ff] border-t-transparent animate-spin block" /> : <Check className="h-3 w-3" />}
                        </button>
                        <button onClick={() => { setAddingAnterior(false); setAnteriorTitulo('') }}
                          className="px-2 h-8 rounded-lg border border-white/[0.08] text-[#444466] hover:text-white transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {localAnteriores.length === 0
                  ? <p className="text-[11px] text-[#222244] italic">Nenhuma ontem</p>
                  : <ul className="space-y-1.5">
                      {localAnteriores.map(task => (
                        <AnteriorItem
                          key={task.id}
                          task={task}
                          canEdit={canEdit}
                          today={today}
                          yesterday={yesterday}
                          onUpdate={updateAnteriorStatus}
                        />
                      ))}
                    </ul>
                }
              </div>

              <Separator className="bg-white/[0.05]" />

              {/* Impedimentos */}
              <div>
                <p className="text-[9px] font-semibold text-[#444466] uppercase tracking-[0.15em] mb-2">Impedimentos</p>
                {!impedimento
                  ? <p className="text-[11px] text-[#222244] italic">Não registrado</p>
                  : impedimento.descricao
                    ? <div className="flex items-start gap-1.5 text-xs">
                        <AlertTriangle className="h-3 w-3 text-[#ff8800] shrink-0 mt-0.5" />
                        <span className="text-[#8888aa]">{impedimento.descricao}</span>
                      </div>
                    : <div className="flex items-center gap-1.5 text-xs">
                        <CheckCircle className="h-3 w-3 text-[#00ff88]" />
                        <span className="text-[#444466]">Sem impedimentos</span>
                      </div>
                }
              </div>

              <Separator className="bg-white/[0.05]" />

              {/* Atuais */}
              <div>
                <p className="text-[9px] font-semibold text-[#444466] uppercase tracking-[0.15em] mb-2">Atividades Atuais</p>
                {canEdit && <div className="mb-2"><AddTaskForm userId={profile.id} date={today} clientes={clientes} /></div>}
                <TaskList tasks={atuais} userId={currentProfile.id} isAdmin={isAdmin} clientes={clientes} />
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

// ── Board principal ──────────────────────────────────────────────────────────
export default function DailyBoard({ profiles, todayTasks, yesterdayTasks, impedimentos,
  faltas, badges, badgeTypes, clientes, currentProfile, today, yesterday }: {
  profiles: Profile[]
  todayTasks: (Task & { profile?: Profile })[]
  yesterdayTasks: (Task & { profile?: Profile })[]
  impedimentos: (Impedimento & { profile?: Profile })[]
  faltas: Falta[]
  badges: Badge[]
  badgeTypes: BadgeType[]
  clientes: Cliente[]
  currentProfile: Profile
  today: string
  yesterday: string
}) {
  // Mapa de faltaId por userId
  const [faltaMap, setFaltaMap] = useState<Map<string, string>>(
    new Map(faltas.map(f => [f.user_id, f.id]))
  )

  // Ordem dos membros no quadro (admin pode reordenar)
  const [ordered, setOrdered] = useState<Profile[]>(profiles)
  const [reordering, setReordering] = useState(false)
  const isAdmin = currentProfile.role === 'admin'
  const supabase = createClient()

  useEffect(() => { setOrdered(profiles) }, [profiles])

  async function moveMember(idx: number, dir: -1 | 1) {
    const j = idx + dir
    if (j < 0 || j >= ordered.length) return
    const next = [...ordered]
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setOrdered(next)
    // Persiste a posição de todos (lista pequena)
    const { error } = await Promise.all(
      next.map((p, i) => supabase.from('profiles').update({ ordem_daily: i }).eq('id', p.id))
    ).then(results => ({ error: results.find(r => r.error)?.error }))
    if (error) toast.error('Erro ao salvar a ordem')
  }

  // Mapa unificado de badge info (estáticos + dinâmicos)
  const badgeInfoMap: Record<string, { emoji: string; label: string }> = {
    ...Object.fromEntries(Object.entries(BADGE_INFO).map(([k, v]) => [k, { emoji: v.emoji, label: v.label }])),
    ...Object.fromEntries(badgeTypes.map(bt => [bt.tipo, { emoji: bt.emoji, label: bt.label }])),
  }

  async function toggleFalta(userId: string, faltaId: string | null) {
    if (faltaId) {
      // Remove falta otimisticamente
      setFaltaMap(prev => { const m = new Map(prev); m.delete(userId); return m })
      await fetch('/api/admin/faltas', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faltaId }),
      })
    } else {
      // Adiciona falta otimisticamente com ID temporário
      const tempId = `temp-${userId}`
      setFaltaMap(prev => new Map(prev).set(userId, tempId))
      const res = await fetch('/api/admin/faltas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, data: today }),
      })
      const data = await res.json()
      if (data.id) setFaltaMap(prev => new Map(prev).set(userId, data.id))
    }
  }

  return (
    <div>
      {/* Reordenar membros — admin */}
      {isAdmin && (
        <div className="flex justify-end mb-3">
          <button
            onClick={() => setReordering(v => !v)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all',
              reordering
                ? 'text-[#00ff88] border-[#00ff88]/30 bg-[#00ff88]/10'
                : 'text-[#6666aa] border-white/[0.07] hover:text-white hover:border-white/[0.15]'
            )}
          >
            <ArrowUpDown className="h-3 w-3" />
            {reordering ? 'Concluir ordenação' : 'Reordenar membros'}
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {ordered.map((profile, i) => {
          const faltaId = faltaMap.get(profile.id) ?? null
          const memberBadges = badges.filter(b => b.user_id === profile.id)
          return (
            <motion.div key={profile.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reordering ? 0 : i * 0.08 }} className="relative">
              {reordering && (
                <div className="absolute -top-2.5 right-4 z-10 flex gap-1">
                  <button
                    onClick={() => moveMember(i, -1)}
                    disabled={i === 0}
                    className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#0a0a22] border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/15 transition-colors disabled:opacity-30"
                    title="Mover para cima"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveMember(i, 1)}
                    disabled={i === ordered.length - 1}
                    className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#0a0a22] border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/15 transition-colors disabled:opacity-30"
                    title="Mover para baixo"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <MemberCard
                profile={profile}
                anteriores={yesterdayTasks.filter(t => t.user_id === profile.id)}
                atuais={todayTasks.filter(t => t.user_id === profile.id)}
                impedimento={impedimentos.find(im => im.user_id === profile.id) ?? null}
                currentProfile={currentProfile}
                today={today}
                yesterday={yesterday}
                faltou={!!faltaId}
                faltaId={faltaId}
                onToggleFalta={toggleFalta}
                memberBadges={memberBadges}
                badgeInfoMap={badgeInfoMap}
                clientes={clientes}
              />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
