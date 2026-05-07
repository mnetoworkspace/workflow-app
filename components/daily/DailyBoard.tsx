'use client'

import { useState, useRef } from 'react'
import { Profile, Task, Impedimento, AvatarFrame } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Clock, XCircle, ArrowRight, AlertTriangle, CheckCircle, Plus, Pencil, Check, X, Smile } from 'lucide-react'
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

function MemberCard({ profile, anteriores, atuais, impedimento, currentProfile, today, yesterday }: {
  profile: Profile
  anteriores: Task[]
  atuais: Task[]
  impedimento: Impedimento | null
  currentProfile: Profile
  today: string
  yesterday: string
}) {
  const isOwn   = profile.id === currentProfile.id
  const isAdmin = currentProfile.role === 'admin'
  const canEdit = isOwn || isAdmin

  const initials  = profile.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const concluidas = atuais.filter(t => t.status === 'concluida').length
  const total      = atuais.length
  const pct        = total > 0 ? Math.round((concluidas / total) * 100) : 0

  // Atividades anteriores local state (optimistic)
  const [localAnteriores, setLocalAnteriores] = useState<Task[]>(anteriores)
  const [addingAnterior, setAddingAnterior]   = useState(false)
  const [anteriorTitulo, setAnteriorTitulo]   = useState('')
  const [savingAnterior, setSavingAnterior]   = useState(false)

  // Mood local state
  const [mood, setMood]           = useState(profile.daily_mood ?? '')
  const [editingMood, setEditingMood] = useState(false)
  const [savingMood, setSavingMood]   = useState(false)

  const supabase = createClient()

  async function addAnterior() {
    if (!anteriorTitulo.trim()) return
    setSavingAnterior(true)
    const { data, error } = await supabase
      .from('tasks')
      .insert({ user_id: profile.id, titulo: anteriorTitulo.trim(), data: yesterday, status: 'concluida' })
      .select()
      .single()
    if (error) {
      toast.error('Erro ao adicionar')
    } else {
      setLocalAnteriores(prev => [...prev, data as Task])
      setAnteriorTitulo('')
      setAddingAnterior(false)
    }
    setSavingAnterior(false)
  }

  async function saveMood() {
    setSavingMood(true)
    await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daily_mood: mood.trim() || null }),
    })
    setSavingMood(false)
    setEditingMood(false)
  }

  // Card border from avatar_frame
  const frameHex = FRAME_HEX[profile.avatar_frame ?? 'none']
  const cardStyle = frameHex
    ? { borderColor: `${frameHex}35`, boxShadow: `0 0 24px ${frameHex}08` }
    : isOwn
      ? { borderColor: 'rgba(0,240,255,0.2)' }
      : { borderColor: 'rgba(255,255,255,0.07)' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="neon-card rounded-2xl border overflow-hidden"
      style={cardStyle}
    >
      {/* Banner */}
      {profile.banner_url && (
        <div className="relative h-24 overflow-hidden">
          <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#05050f]/20 to-[#05050f]/95" />
        </div>
      )}

      <div className={cn('p-5', profile.banner_url && '-mt-8 relative')}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Avatar className={cn('h-10 w-10 rounded-full shrink-0', frameClass(profile.avatar_frame))}>
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.name} />}
            <AvatarFallback className="bg-[#0a0a20] text-[#00f0ff] text-sm font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white text-sm">{profile.name}</h3>
              {isOwn && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20">você</span>}
            </div>
            {profile.cargo && <p className="text-[11px] text-[#444466]">{profile.cargo}</p>}

            {/* Mood */}
            <div className="mt-0.5">
              <AnimatePresence mode="wait">
                {editingMood ? (
                  <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 mt-1">
                    <Input
                      value={mood}
                      onChange={e => setMood(e.target.value)}
                      placeholder="Frase do dia... ex: 🔥 No modo"
                      className="neon-input h-7 text-xs flex-1"
                      maxLength={60}
                      autoFocus
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
          </div>

          {total > 0 && (
            <div className="text-right shrink-0">
              <span className="text-sm font-bold font-mono text-[#00ff88]">{concluidas}/{total}</span>
              <p className="text-[10px] text-[#444466]">{pct}%</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="h-0.5 bg-white/[0.05] rounded-full overflow-hidden mb-4">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#b44bff] to-[#00f0ff]"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
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
                      value={anteriorTitulo}
                      onChange={e => setAnteriorTitulo(e.target.value)}
                      placeholder="O que foi feito ontem..."
                      className="neon-input h-8 text-xs flex-1"
                      autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') addAnterior(); if (e.key === 'Escape') setAddingAnterior(false) }}
                    />
                    <button onClick={addAnterior} disabled={savingAnterior || !anteriorTitulo.trim()}
                      className="px-2 h-8 rounded-lg bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] text-xs hover:bg-[#00f0ff]/20 transition-colors disabled:opacity-40 shrink-0">
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
                    <li key={task.id} className="flex items-center gap-2 text-xs">
                      <StatusIcon status={task.status} />
                      <span className={cn(
                        task.status === 'concluida' ? 'text-[#444466] line-through' : 'text-[#8888aa]',
                        task.status === 'cancelada' && 'text-[#333355] line-through'
                      )}>{task.titulo}</span>
                      {task.status === 'postergada' && (
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-[#ff8800]/10 text-[#ff8800] border border-[#ff8800]/20 shrink-0">postergada</span>
                      )}
                    </li>
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
            {canEdit && <div className="mb-2"><AddTaskForm userId={profile.id} date={today} /></div>}
            <TaskList tasks={atuais} userId={currentProfile.id} isAdmin={isAdmin} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function DailyBoard({ profiles, todayTasks, yesterdayTasks, impedimentos, currentProfile, today, yesterday }: {
  profiles: Profile[]
  todayTasks: (Task & { profile?: Profile })[]
  yesterdayTasks: (Task & { profile?: Profile })[]
  impedimentos: (Impedimento & { profile?: Profile })[]
  currentProfile: Profile
  today: string
  yesterday: string
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {profiles.map((profile, i) => (
        <motion.div key={profile.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}>
          <MemberCard
            profile={profile}
            anteriores={yesterdayTasks.filter(t => t.user_id === profile.id)}
            atuais={todayTasks.filter(t => t.user_id === profile.id)}
            impedimento={impedimentos.find(im => im.user_id === profile.id) ?? null}
            currentProfile={currentProfile}
            today={today}
            yesterday={yesterday}
          />
        </motion.div>
      ))}
    </div>
  )
}
