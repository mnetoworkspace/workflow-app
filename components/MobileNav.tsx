'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, User, Building2, FolderKanban } from 'lucide-react'
import { motion } from 'framer-motion'

const baseItems = [
  { href: '/dashboard', label: 'Tarefas',  icon: LayoutDashboard, color: '#00f0ff' },
  { href: '/daily',     label: 'Daily',    icon: Users,           color: '#b44bff' },
  { href: '/producao',  label: 'Produção', icon: FolderKanban,    color: '#00ff88' },
  { href: '/clientes',  label: 'Clientes', icon: Building2,       color: '#ff0080' },
  { href: '/perfil',    label: 'Perfil',   icon: User,            color: '#00ff88' },
]

export default function MobileNav() {
  const pathname = usePathname()
  const items = baseItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-[#06061a]/96 backdrop-blur-xl border-t border-white/[0.08]">
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00f0ff]/25 to-transparent" />

        <div className="flex items-center h-16">
          {items.map(({ href, label, icon: Icon, color }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative"
                style={{ color: isActive ? color : '#444466' }}
              >
                {isActive && (
                  <>
                    <motion.div
                      layoutId="mobileTab"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[2px] rounded-full"
                      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                    />
                    <div
                      className="absolute inset-x-2 inset-y-1 rounded-xl opacity-10"
                      style={{ background: color }}
                    />
                  </>
                )}
                <Icon className="h-[18px] w-[18px] relative" />
                <span className="text-[10px] font-medium relative leading-none">{label}</span>
              </Link>
            )
          })}
        </div>
        {/* iOS home indicator safe area */}
        <div style={{ height: 'env(safe-area-inset-bottom)' }} />
      </div>
    </nav>
  )
}
