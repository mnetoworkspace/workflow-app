'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Profile, getNivel, getProximoNivel } from '@/types'
import { Flame, Star, TrendingUp } from 'lucide-react'

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const step = Math.ceil(value / 30)
    const timer = setInterval(() => {
      start = Math.min(start + step, value)
      setDisplay(start)
      if (start >= value) clearInterval(timer)
    }, 30)
    return () => clearInterval(timer)
  }, [value])
  return <span>{display}</span>
}

export default function StatsBar({ profile }: { profile: Profile }) {
  const nivel = getNivel(profile.pontos)
  const proximo = getProximoNivel(profile.pontos)
  const nivelBase: Record<string, number> = {
    'Estagiário de Elite': 0, 'Colaborador Raiz': 100,
    'Sênior de Verdade': 300, 'Ninja do Squad': 600, 'Lenda Vivente': 1000,
  }
  const pontoBase = nivelBase[nivel] ?? 0
  const range = proximo ? proximo.pontosNecessarios - pontoBase : 1
  const progresso = proximo ? Math.min(((profile.pontos - pontoBase) / range) * 100, 100) : 100

  const stats = [
    { icon: Flame, value: profile.streak, label: 'dias seguidos', color: '#ff8800', glow: 'glow-orange', border: 'border-[#ff8800]/20', bg: 'bg-[#ff8800]/05' },
    { icon: Star,  value: profile.pontos, label: 'pontos totais', color: '#ffe600', glow: '', border: 'border-[#ffe600]/20', bg: 'bg-[#ffe600]/05' },
    { icon: TrendingUp, value: null, label: nivel, color: '#b44bff', glow: '', border: 'border-[#b44bff]/20', bg: 'bg-[#b44bff]/05' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map(({ icon: Icon, value, label, color, glow, border, bg }, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          className={`neon-card rounded-xl p-4 border ${border} ${bg}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-3.5 w-3.5" style={{ color, filter: `drop-shadow(0 0 6px ${color})` }} />
            <span className="text-[10px] text-[#6666aa] font-medium uppercase tracking-wider">
              {i === 2 ? 'Nível' : i === 0 ? 'Streak' : 'Pontos'}
            </span>
          </div>
          {value !== null ? (
            <p className="text-2xl font-bold font-mono" style={{ color, textShadow: `0 0 12px ${color}80` }}>
              <AnimatedNumber value={value} />
            </p>
          ) : (
            <p className="text-sm font-bold leading-tight" style={{ color }}>{label}</p>
          )}
          {value !== null && <p className="text-[11px] text-[#444466] mt-0.5">{label}</p>}
          {i === 2 && proximo && (
            <div className="mt-2">
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, #b44bff, #00f0ff)` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progresso}%` }}
                  transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="text-[10px] text-[#444466] mt-1">{proximo.pontosNecessarios - profile.pontos} pts → {proximo.nome.split(' ')[0]}</p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
