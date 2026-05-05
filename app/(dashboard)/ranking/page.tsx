import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getNivel, BADGE_INFO, AvatarFrame } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Flame, Star, Trophy, Zap } from 'lucide-react'
import { format, startOfWeek } from 'date-fns'
import { cn } from '@/lib/utils'

function frameClass(f: AvatarFrame) { return f && f !== 'none' ? `frame-${f}` : '' }

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const inicioSemana = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const [{ data: profiles }, { data: pontosSemanais }, { data: badges }] = await Promise.all([
    supabase.from('profiles').select('*').order('pontos', { ascending: false }),
    supabase.from('pontos_historico').select('user_id, pontos').gte('created_at', `${inicioSemana}T00:00:00`),
    supabase.from('badges').select('*'),
  ])

  const pontosPor: Record<string, number> = {}
  pontosSemanais?.forEach(p => { pontosPor[p.user_id] = (pontosPor[p.user_id] ?? 0) + p.pontos })

  const rankingSemanal = (profiles ?? [])
    .map(p => ({ ...p, pontosSemanais: pontosPor[p.id] ?? 0 }))
    .sort((a, b) => b.pontosSemanais - a.pontosSemanais)

  const podiumColors = ['#ffe600', '#c0c0c0', '#cd7f32']
  const podiumGlows  = ['rgba(255,230,0,0.4)', 'rgba(192,192,192,0.3)', 'rgba(205,127,50,0.3)']
  const titles = ['Destruindo tudo 🔥', 'Chegando lá 💪', 'Vem mais não? 😏', 'Guardando energia 😴']

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="h-6 w-6 text-[#ffe600]" style={{ filter: 'drop-shadow(0 0 8px #ffe600)' }} />
          Ranking
        </h1>
        <p className="text-[#6666aa] text-sm mt-1">Quem tá mandando bem essa semana?</p>
      </div>

      {/* Weekly ranking */}
      <div className="neon-card rounded-2xl overflow-hidden border border-[#ffe600]/10 mb-5">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-[#ffe600]" style={{ filter: 'drop-shadow(0 0 4px #ffe600)' }} />
          <span className="text-xs font-semibold text-[#ffe600] uppercase tracking-wider">Esta semana</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {rankingSemanal.map((profile, index) => {
            const initials = profile.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
            const isUser = profile.id === user.id
            const color = podiumColors[index]
            const glow = podiumGlows[index]
            const isPodium = index < 3

            return (
              <div key={profile.id} className={cn('flex items-center gap-4 px-5 py-4 transition-colors', isUser && 'bg-white/[0.03]')}>
                <div className="w-8 text-center">
                  {isPodium
                    ? <span className="text-lg" style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
                        {['🥇','🥈','🥉'][index]}
                      </span>
                    : <span className="text-sm text-[#333355] font-mono">{index + 1}</span>
                  }
                </div>

                <Avatar className={cn('h-9 w-9 rounded-full', frameClass(profile.avatar_frame))}>
                  {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.name} />}
                  <AvatarFallback className="bg-[#0a0a20] text-xs font-bold" style={{ color: color || '#6666aa' }}>
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">{profile.name}</span>
                    {isUser && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20">você</span>}
                  </div>
                  <span className="text-xs text-[#444466]">{titles[index] ?? '...'}</span>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Star className="h-3 w-3" style={{ color: color || '#6666aa' }} />
                    <span className="text-sm font-bold font-mono" style={{ color: color || '#6666aa', textShadow: isPodium ? `0 0 8px ${glow}` : 'none' }}>
                      {profile.pontosSemanais}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#333355]">esta semana</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* All-time ranking */}
      <div className="neon-card rounded-2xl overflow-hidden border border-white/[0.07]">
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
          <Flame className="h-3.5 w-3.5 text-[#ff8800]" style={{ filter: 'drop-shadow(0 0 4px #ff8800)' }} />
          <span className="text-xs font-semibold text-[#ff8800] uppercase tracking-wider">Ranking geral</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {(profiles ?? []).map((profile, index) => {
            const initials = profile.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
            const isUser = profile.id === user.id
            const nivel = getNivel(profile.pontos)
            const userBadges = badges?.filter(b => b.user_id === profile.id) ?? []

            return (
              <div key={profile.id} className={cn('flex items-center gap-4 px-5 py-4', isUser && 'bg-white/[0.03]')}>
                <span className="text-xs text-[#333355] font-mono w-5 text-center">{index + 1}</span>
                <Avatar className={cn('h-9 w-9 rounded-full', frameClass(profile.avatar_frame))}>
                  {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.name} />}
                  <AvatarFallback className="bg-[#0a0a20] text-[#6666aa] text-xs font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white truncate">{profile.name}</span>
                    {isUser && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20">você</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-[#444466]">{nivel}</span>
                    {userBadges.slice(0, 4).map(badge => (
                      <span key={badge.id} className="text-xs" title={BADGE_INFO[badge.tipo as keyof typeof BADGE_INFO]?.label}>
                        {BADGE_INFO[badge.tipo as keyof typeof BADGE_INFO]?.emoji}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  <div className="flex items-center gap-1 justify-end">
                    <Flame className="h-3 w-3 text-[#ff8800]" />
                    <span className="text-xs font-mono text-[#ff8800]">{profile.streak}</span>
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <Star className="h-3 w-3 text-[#ffe600]" />
                    <span className="text-sm font-bold font-mono text-[#ffe600]">{profile.pontos}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
