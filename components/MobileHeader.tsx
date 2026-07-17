'use client'

import { Profile, AvatarFrame } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, Shield } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

function frameClass(f: AvatarFrame) { return f && f !== 'none' ? `frame-${f}` : '' }

export default function MobileHeader({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const initials = profile.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <header
      className="md:hidden sticky top-0 z-40 bg-[#06061a]/96 backdrop-blur-xl"
    >
      {/* Safe area for notch / Dynamic Island / status bar */}
      <div style={{ height: 'env(safe-area-inset-top)' }} />
      <div className="h-px bg-gradient-to-r from-transparent via-[#6ff203]/40 to-transparent" />
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <img
            src="/fonil-icon.webp"
            alt="Fonil"
            className="h-6 w-6 rounded-md"
            style={{ filter: 'drop-shadow(0 0 6px rgba(111,242,3,0.5))' }}
          />
          <span className="font-bold text-white text-base tracking-widest text-glow-fonil">
            FONIL GROUP
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/ranking"
            className={cn(
              'p-2 rounded-lg transition-colors',
              pathname === '/ranking' ? 'text-[#ff8800] bg-[#ff8800]/10' : 'text-[#6666aa] hover:text-[#ff8800]'
            )}
          >
            <Trophy className="h-4.5 w-4.5" />
          </Link>
          {profile.role === 'admin' && (
            <Link
              href="/admin"
              className={cn(
                'p-2 rounded-lg transition-colors',
                pathname === '/admin' ? 'text-[#b44bff] bg-[#b44bff]/10' : 'text-[#6666aa] hover:text-[#b44bff]'
              )}
            >
              <Shield className="h-4.5 w-4.5" />
            </Link>
          )}
          <Link href="/perfil" className="ml-1">
            <Avatar className={cn('h-8 w-8 rounded-full', frameClass(profile.avatar_frame))}>
              {profile.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={profile.name} />
              )}
              <AvatarFallback className="bg-[#0f0f28] text-[#00f0ff] text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  )
}
