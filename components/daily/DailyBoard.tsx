'use client'

import { Profile, Task, Impedimento, AvatarFrame } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, Clock, XCircle, ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react'
import TaskList from '@/components/tasks/TaskList'
import AddTaskForm from '@/components/tasks/AddTaskForm'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

function frameClass(f: AvatarFrame) { return f && f !== 'none' ? `frame-${f}` : '' }

function StatusIcon({ status }: { status: Task['status'] }) {
  const map = {
    concluida:    <CheckCircle2 className="h-3 w-3 text-[#00ff88]" />,
    em_andamento: <Clock        className="h-3 w-3 text-[#00f0ff]" />,
    cancelada:    <XCircle      className="h-3 w-3 text-[#ff0055]" />,
    postergada:   <ArrowRight   className="h-3 w-3 text-[#ff8800]" />,
  }
  return map[status]
}

function MemberCard({ profile, anteriores, atuais, impedimento, currentProfile, today }: {
  profile: Profile; anteriores: Task[]; atuais: Task[]
  impedimento: Impedimento | null; currentProfile: Profile; today: string
}) {
  const isOwn = profile.id === currentProfile.id
  const isAdmin = currentProfile.role === 'admin'
  const initials = profile.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const concluidas = atuais.filter(t => t.status === 'concluida').length
  const total = atuais.length
  const pct = total > 0 ? Math.round((concluidas / total) * 100) : 0

  const borderColor = isOwn ? 'border-[#00f0ff]/20' : 'border-white/[0.07]'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('neon-card rounded-2xl p-5 border', borderColor)}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar className={cn('h-10 w-10 rounded-full', frameClass(profile.avatar_frame))}>
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.name} />}
          <AvatarFallback className="bg-[#0a0a20] text-[#00f0ff] text-sm font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-sm">{profile.name}</h3>
            {isOwn && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20">você</span>}
          </div>
          {profile.cargo && <p className="text-[11px] text-[#444466]">{profile.cargo}</p>}
        </div>
        {total > 0 && (
          <div className="text-right">
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
          <p className="text-[9px] font-semibold text-[#444466] uppercase tracking-[0.15em] mb-2">Atividades Anteriores</p>
          {anteriores.length === 0
            ? <p className="text-[11px] text-[#222244] italic">Nenhuma ontem</p>
            : <ul className="space-y-1.5">
                {anteriores.map(task => (
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
          {(isOwn || isAdmin) && <div className="mb-2"><AddTaskForm userId={profile.id} date={today} /></div>}
          <TaskList tasks={atuais} userId={currentProfile.id} isAdmin={isAdmin} />
        </div>
      </div>
    </motion.div>
  )
}

export default function DailyBoard({ profiles, todayTasks, yesterdayTasks, impedimentos, currentProfile, today }: {
  profiles: Profile[]; todayTasks: (Task & { profile?: Profile })[]; yesterdayTasks: (Task & { profile?: Profile })[]
  impedimentos: (Impedimento & { profile?: Profile })[]; currentProfile: Profile; today: string
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
          />
        </motion.div>
      ))}
    </div>
  )
}
