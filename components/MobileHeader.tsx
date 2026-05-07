'use client'

import { Profile, AvatarFrame } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Zap } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

function frameClass(f: AvatarFrame) { return f && f !== 'none' ? `frame-${f}` : '' }

export default function MobileHeader({ profile }: { profile: Profile }) {
  const initials = profile.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <header
      className="md:hidden sticky top-0 z-40 bg-[#06061a]/96 backdrop-blur-xl"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="h-px bg-gradient-to-r from-transparent via-[#00f0ff]/40 to-transparent" />
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <Zap
            className="h-5 w-5 text-[#00f0ff]"
            style={{ filter: 'drop-shadow(0 0 6px #00f0ff)' }}
          />
          <span className="font-bold text-white text-base tracking-widest text-glow-cyan">
            DAILYFLUX
          </span>
        </div>
        <Link href="/perfil">
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
    </header>
  )
}
