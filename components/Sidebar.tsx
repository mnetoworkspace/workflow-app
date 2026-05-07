'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile, getNivel, AvatarFrame } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Trophy, User, LogOut, Zap, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/dashboard', label: 'Minhas Tarefas', icon: LayoutDashboard, color: 'cyan' },
  { href: '/daily',     label: 'Daily',          icon: Users,           color: 'purple' },
  { href: '/ranking',   label: 'Ranking',        icon: Trophy,          color: 'orange' },
  { href: '/perfil',    label: 'Perfil',         icon: User,            color: 'green' },
]

const colorMap: Record<string, string> = {
  cyan:   'text-[#00f0ff] group-hover:text-[#00f0ff]',
  purple: 'text-[#b44bff] group-hover:text-[#b44bff]',
  green:  'text-[#00ff88] group-hover:text-[#00ff88]',
  orange: 'text-[#ff8800] group-hover:text-[#ff8800]',
  pink:   'text-[#ff0080] group-hover:text-[#ff0080]',
}

const activeGlow: Record<string, string> = {
  cyan:   'bg-[#00f0ff]/10 border-[#00f0ff]/30',
  purple: 'bg-[#b44bff]/10 border-[#b44bff]/30',
  green:  'bg-[#00ff88]/10 border-[#00ff88]/30',
  orange: 'bg-[#ff8800]/10 border-[#ff8800]/30',
  pink:   'bg-[#ff0080]/10 border-[#ff0080]/30',
}

function getFrameClass(frame: AvatarFrame) {
  if (!frame || frame === 'none') return ''
  return `frame-${frame}`
}

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Até logo!')
    router.push('/login')
    router.refresh()
  }

  const initials = profile.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-white/[0.06] bg-[#06061a] relative overflow-hidden">
      {/* Ambient glow top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00f0ff]/40 to-transparent" />

      {/* Logo */}
      <div className="p-6 border-b border-white/[0.06]">
        <motion.div
          className="flex items-center gap-2.5"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative">
            <Zap className="h-6 w-6 text-[#00f0ff]" style={{ filter: 'drop-shadow(0 0 8px #00f0ff)' }} />
          </div>
          <div>
            <span className="font-bold text-white text-lg tracking-widest text-glow-cyan">DAILYFLUX</span>
          </div>
        </motion.div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, color }, i) => {
          const isActive = pathname === href
          return (
            <motion.div
              key={href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
            >
              <Link
                href={href}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border relative',
                  isActive
                    ? cn('text-white', activeGlow[color])
                    : 'text-[#6666aa] hover:text-white border-transparent hover:bg-white/[0.04] hover:border-white/[0.08]'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                    style={{ background: `var(--n${color === 'cyan' ? 'c' : color === 'purple' ? 'p' : color === 'green' ? 'g' : color === 'orange' ? 'o' : 'k'})` }}
                  />
                )}
                <Icon className={cn('h-4 w-4 transition-colors', isActive ? colorMap[color] : 'group-hover:' + colorMap[color])} />
                <span>{label}</span>
              </Link>
            </motion.div>
          )
        })}

        {profile.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.28, duration: 0.3 }}
          >
            <Link
              href="/admin"
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border mt-2',
                pathname === '/admin'
                  ? 'text-[#b44bff] bg-[#b44bff]/10 border-[#b44bff]/30'
                  : 'text-[#b44bff]/50 border-transparent hover:text-[#b44bff] hover:bg-[#b44bff]/05 hover:border-[#b44bff]/20'
              )}
            >
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          </motion.div>
        )}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 mb-3 px-1">
          <Avatar className={cn('h-9 w-9 rounded-full transition-all', getFrameClass(profile.avatar_frame))}>
            {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.name} />}
            <AvatarFallback className="bg-[#0f0f28] text-[#00f0ff] text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{profile.name}</p>
            <p className="text-[11px] text-[#6666aa] truncate">{getNivel(profile.pontos)}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-[#6666aa] hover:text-[#ff0055] text-sm w-full px-3 py-2 rounded-lg hover:bg-[#ff0055]/05 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>

      {/* Bottom ambient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#b44bff]/30 to-transparent" />
    </aside>
  )
}
