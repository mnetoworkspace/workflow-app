'use client'

import { useState, useMemo, useCallback } from 'react'
import { Profile, Task, Impedimento, Falta, AvatarFrame } from '@/types'
import { createClient } from '@/lib/supabase/client'
import {
  format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, subDays, isToday, isSameMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ChevronLeft, ChevronRight, Users, CheckCircle2, AlertTriangle,
  UserX, Clock, ArrowRight, XCircle,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

const FRAME_HEX: Record<string, string> = {
  none: '', cyan: '#00f0ff', purple: '#b44bff',
  green: '#00ff88', pink: '#ff0080', gold: '#ffe600', rainbow: '#b44bff',
}
function frameClass(f: AvatarFrame) { return f && f !== 'none' ? `frame-${f}` : '' }

const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// ── Calendário ────────────────────────────────────────────────────────────────
function CalendarGrid({ markedDates, selectedDate, onSelect, currentMonth, onMonthChange }: {
  markedDates: Set<string>
  selectedDate: string | null
  onSelect: (date: string) => void
  currentMonth: Date
  onMonthChange: (d: Date) => void
}) {
  const today    = new Date()
  const firstDay = startOfMonth(currentMonth)
  const days     = eachDayOfInterval({ start: firstDay, end: endOfMonth(currentMonth) })
  const offset   = (getDay(firstDay) + 6) % 7  // Monday-first
  const isCurrentMonth = isSameMonth(currentMonth, today)
  const monthLabel     = format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="neon-card rounded-2xl border border-white/[0.07] p-4 md:p-5">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-[#6666aa] hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-semibold text-white capitalize">{monthLabel}</h2>
        <button
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          disabled={isCurrentMonth}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-[#6666aa] hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-[#444466] py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: offset }).map((_, i) => <div key={`empty-${i}`} />)}

        {days.map(day => {
          const dateStr      = format(day, 'yyyy-MM-dd')
          const hasData      = markedDates.has(dateStr)
          const isSelected   = selectedDate === dateStr
          const isTodayDate  = isToday(day)
          // Mon=0..Sun=6 in our Monday-first scheme
          const weekdayIdx   = (getDay(day) + 6) % 7
          const isWeekendDay = weekdayIdx >= 5

          return (
            <button
              key={dateStr}
              onClick={() => hasData && onSelect(dateStr)}
              disabled={!hasData}
              className={cn(
                'relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-all text-sm',
                hasData && !isSelected && 'hover:bg-white/[0.06] cursor-pointer',
                isSelected && 'bg-gradient-to-b from-[#b44bff]/25 to-[#00f0ff]/10 cursor-pointer',
                isTodayDate && !isSelected && 'ring-1 ring-[#00f0ff]/25',
                !hasData && 'cursor-default',
              )}
            >
              <span className={cn(
                'text-sm font-medium leading-none',
                isSelected   ? 'text-white'     :
                hasData      ? 'text-[#c8c8e8]' :
                isWeekendDay ? 'text-[#2a2a44]' : 'text-[#3a3a55]',
              )}>
                {format(day, 'd')}
              </span>
              {/* Dot marker */}
              {hasData && (
                <div className={cn(
                  'h-1 w-1 rounded-full mt-1',
                  isSelected ? 'bg-[#b44bff]' : 'bg-[#00f0ff]',
                )} />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-1.5 text-[10px] text-[#444466]">
          <div className="h-1.5 w-1.5 rounded-full bg-[#00f0ff]" />
          Com daily
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#444466]">
          <div className="h-1.5 w-1.5 rounded-full bg-[#b44bff]" />
          Selecionado
        </div>
        {/* Today indicator */}
        <div className="flex items-center gap-1.5 text-[10px] text-[#444466]">
          <div className="h-3 w-3 rounded ring-1 ring-[#00f0ff]/25" />
          Hoje
        </div>
      </div>
    </div>
  )
}

// ── Stats do dia ──────────────────────────────────────────────────────────────
function DaySummary({ profiles, tasks, impedimentos, faltas }: {
  profiles: Profile[]
  tasks: Task[]
  impedimentos: Impedimento[]
  faltas: Falta[]
}) {
  const total       = tasks.length
  const concluidas  = tasks.filter(t => t.status === 'concluida').length
  const ausentes    = faltas.length
  const presentes   = profiles.length - ausentes
  const withImpedimento = impedimentos.filter(i => i.descricao).length

  const stats = [
    { label: 'Presentes',    value: `${presentes}/${profiles.length}`, icon: Users,         color: '#00f0ff' },
    { label: 'Concluídas',   value: `${concluidas}/${total}`,          icon: CheckCircle2,  color: '#00ff88' },
    { label: 'Ausentes',     value: ausentes,                           icon: UserX,         color: '#ff0055' },
    { label: 'Impedimentos', value: withImpedimento,                    icon: AlertTriangle, color: '#ff8800' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="neon-card rounded-xl border border-white/[0.07] p-3 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
            <Icon className="h-4 w-4" style={{ color }} />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold font-mono text-white leading-none">{value}</p>
            <p className="text-[10px] text-[#444466] mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Status icon ───────────────────────────────────────────────────────────────
function StatusIcon({ status }: { status: Task['status'] }) {
  if (status === 'concluida')    return <CheckCircle2 className="h-3 w-3 text-[#00ff88] shrink-0" />
  if (status === 'em_andamento') return <Clock        className="h-3 w-3 text-[#00f0ff] shrink-0" />
  if (status === 'cancelada')    return <XCircle      className="h-3 w-3 text-[#ff0055] shrink-0" />
  return                                <ArrowRight   className="h-3 w-3 text-[#ff8800] shrink-0" />
}

// ── Card de membro (read-only) ────────────────────────────────────────────────
function HistoricoMemberCard({ profile, anteriores, atuais, impedimento, faltou }: {
  profile: Profile
  anteriores: Task[]
  atuais: Task[]
  impedimento: Impedimento | null
  faltou: boolean
}) {
  const initials   = profile.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const concluidas = atuais.filter(t => t.status === 'concluida').length
  const total      = atuais.length
  const pct        = total > 0 ? Math.round((concluidas / total) * 100) : 0

  const frameHex = FRAME_HEX[profile.avatar_frame ?? 'none']
  const cardStyle = faltou
    ? { borderColor: 'rgba(255,0,85,0.35)' }
    : frameHex
      ? { borderColor: `${frameHex}35` }
      : { borderColor: 'rgba(255,255,255,0.07)' }

  const semAtividade = atuais.length === 0 && anteriores.length === 0 && !impedimento

  return (
    <div className="neon-card rounded-2xl border overflow-hidden" style={cardStyle}>
      {faltou && <div className="h-1 bg-gradient-to-r from-[#ff0055]/60 via-[#ff0055]/80 to-[#ff0055]/60" />}

      {profile.banner_url && !faltou && (
        <div className="relative h-20 overflow-hidden">
          <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#05050f]/90" />
        </div>
      )}

      <div
        className={cn('p-4', profile.banner_url && !faltou && '-mt-6 relative')}
        style={{ opacity: faltou ? 0.65 : 1 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className={cn('h-9 w-9 rounded-full shrink-0', frameClass(profile.avatar_frame))}>
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.name} />}
            <AvatarFallback className="bg-[#0a0a20] text-[#00f0ff] text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white text-sm">{profile.name}</h3>
              {faltou && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ff0055]/15 text-[#ff0055] border border-[#ff0055]/30 font-semibold">
                  FALTOU
                </span>
              )}
            </div>
            {profile.cargo && <p className="text-[11px] text-[#444466]">{profile.cargo}</p>}
          </div>

          {total > 0 && !faltou && (
            <div className="text-right shrink-0">
              <span className="text-sm font-bold font-mono text-[#00ff88]">{concluidas}/{total}</span>
              <p className="text-[10px] text-[#444466]">{pct}%</p>
            </div>
          )}
        </div>

        {faltou ? (
          <p className="text-xs text-[#333355] italic text-center py-3">Ausente nesta daily</p>
        ) : semAtividade ? (
          <p className="text-xs text-[#222244] italic text-center py-3">Sem atividades registradas</p>
        ) : (
          <div className="space-y-3">
            {total > 0 && (
              <div className="h-0.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#b44bff] to-[#00f0ff] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}

            {anteriores.length > 0 && (
              <div>
                <p className="text-[9px] font-semibold text-[#444466] uppercase tracking-[0.15em] mb-1.5">
                  Atividades Anteriores
                </p>
                <ul className="space-y-1">
                  {anteriores.map(task => (
                    <li key={task.id} className="flex items-center gap-2 text-xs">
                      <StatusIcon status={task.status} />
                      <span className={cn(
                        'flex-1 truncate',
                        task.status === 'concluida' ? 'text-[#444466] line-through' : 'text-[#8888aa]',
                        task.status === 'cancelada' && 'text-[#333355] line-through',
                      )}>
                        {task.titulo}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {impedimento && (
              <>
                {anteriores.length > 0 && <Separator className="bg-white/[0.05]" />}
                <div>
                  <p className="text-[9px] font-semibold text-[#444466] uppercase tracking-[0.15em] mb-1.5">
                    Impedimento
                  </p>
                  {impedimento.descricao ? (
                    <div className="flex items-start gap-1.5 text-xs">
                      <AlertTriangle className="h-3 w-3 text-[#ff8800] shrink-0 mt-0.5" />
                      <span className="text-[#8888aa]">{impedimento.descricao}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="h-3 w-3 text-[#00ff88]" />
                      <span className="text-[#444466]">Sem impedimentos</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {atuais.length > 0 && (
              <>
                {(anteriores.length > 0 || impedimento) && <Separator className="bg-white/[0.05]" />}
                <div>
                  <p className="text-[9px] font-semibold text-[#444466] uppercase tracking-[0.15em] mb-1.5">
                    Atividades
                  </p>
                  <ul className="space-y-1">
                    {atuais.map(task => (
                      <li key={task.id} className="flex items-center gap-2 text-xs">
                        <StatusIcon status={task.status} />
                        <span className={cn(
                          'flex-1 truncate',
                          task.status === 'concluida' ? 'text-[#444466] line-through' : 'text-[#8888aa]',
                          task.status === 'cancelada' && 'text-[#333355] line-through',
                        )}>
                          {task.titulo}
                        </span>
                        <span className={cn(
                          'text-[9px] px-1.5 py-0.5 rounded-full border shrink-0',
                          `status-${task.status}`,
                        )}>
                          {task.status === 'concluida'    ? 'ok'
                           : task.status === 'postergada' ? '→'
                           : task.status === 'cancelada'  ? '✕'
                           : '●'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface DayData {
  todayTasks: Task[]
  yesterdayTasks: Task[]
  impedimentos: Impedimento[]
  faltas: Falta[]
}

// ── Board principal ───────────────────────────────────────────────────────────
export default function HistoricoBoard({ profiles, markedDates, currentProfile }: {
  profiles: Profile[]
  markedDates: string[]
  currentProfile: Profile
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayData, setDayData]           = useState<DayData | null>(null)
  const [loading, setLoading]           = useState(false)

  const markedSet = useMemo(() => new Set(markedDates), [markedDates])

  const handleSelectDate = useCallback(async (date: string) => {
    if (selectedDate === date) {
      setSelectedDate(null)
      setDayData(null)
      return
    }
    setSelectedDate(date)
    setDayData(null)
    setLoading(true)

    const yesterday = format(subDays(parseISO(date), 1), 'yyyy-MM-dd')
    const supabase  = createClient()

    const [
      { data: todayTasks },
      { data: yesterdayTasks },
      { data: impedimentos },
      { data: faltas },
    ] = await Promise.all([
      supabase.from('tasks').select('*').eq('data', date),
      supabase.from('tasks').select('*').eq('data', yesterday),
      supabase.from('impedimentos').select('*').eq('data', date),
      supabase.from('faltas').select('*').eq('data', date),
    ])

    setDayData({
      todayTasks:     todayTasks     ?? [],
      yesterdayTasks: yesterdayTasks ?? [],
      impedimentos:   impedimentos   ?? [],
      faltas:         faltas         ?? [],
    })
    setLoading(false)
  }, [selectedDate])

  const formattedSelected = selectedDate
    ? format(parseISO(selectedDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : null

  return (
    <div className="space-y-6">
      <CalendarGrid
        markedDates={markedSet}
        selectedDate={selectedDate}
        onSelect={handleSelectDate}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
      />

      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white capitalize">{formattedSelected}</h2>
                <p className="text-xs text-[#444466] mt-0.5">Snapshot da daily</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-6 w-6 rounded-full border-2 border-[#00f0ff] border-t-transparent animate-spin" />
              </div>
            ) : dayData ? (
              <>
                <DaySummary
                  profiles={profiles}
                  tasks={dayData.todayTasks}
                  impedimentos={dayData.impedimentos}
                  faltas={dayData.faltas}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  {profiles.map((profile, i) => (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <HistoricoMemberCard
                        profile={profile}
                        anteriores={dayData.yesterdayTasks.filter(t => t.user_id === profile.id)}
                        atuais={dayData.todayTasks.filter(t => t.user_id === profile.id)}
                        impedimento={dayData.impedimentos.find(im => im.user_id === profile.id) ?? null}
                        faltou={dayData.faltas.some(f => f.user_id === profile.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {markedDates.length === 0 && (
        <div className="text-center py-16 text-[#333355]">
          <p className="text-sm">Nenhuma daily registrada ainda</p>
        </div>
      )}
    </div>
  )
}
