'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Profile, Badge, BadgeType } from '@/types'
import { UserPlus, Users, Star, Trophy, Mail } from 'lucide-react'
import InviteForm from './InviteForm'
import MemberList from './MemberList'
import PointsManager from './PointsManager'
import BadgeManager from './BadgeManager'

type Tab = 'convites' | 'membros' | 'pontos' | 'badges'

const TABS: { id: Tab; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'convites', label: 'Convites',  icon: Mail,    color: '#00f0ff' },
  { id: 'membros',  label: 'Membros',   icon: Users,   color: '#b44bff' },
  { id: 'pontos',   label: 'Pontos',    icon: Star,    color: '#ffe600' },
  { id: 'badges',   label: 'Badges',    icon: Trophy,  color: '#ff8800' },
]

export default function AdminPanel({
  members, allBadges, badgeTypes, currentUserId,
}: {
  members: Profile[]
  allBadges: Badge[]
  badgeTypes: BadgeType[]
  currentUserId: string
}) {
  const [tab, setTab] = useState<Tab>('convites')

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-5">
        {TABS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={tab === id ? { color, background: `${color}15` } : { color: '#444466' }}
          >
            {tab === id && (
              <motion.div
                layoutId="adminTab"
                className="absolute inset-0 rounded-lg"
                style={{ border: `1px solid ${color}40` }}
              />
            )}
            <Icon className="h-3.5 w-3.5 relative" />
            <span className="relative hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'convites' && <InviteForm />}
          {tab === 'membros'  && <MemberList members={members} currentUserId={currentUserId} />}
          {tab === 'pontos'   && <PointsManager members={members} />}
          {tab === 'badges'   && <BadgeManager members={members} allBadges={allBadges} badgeTypes={badgeTypes} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
