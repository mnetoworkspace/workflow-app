'use client'

import { useState, useEffect } from 'react'
import { Profile, PontosHistorico } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Plus, Minus, Trash2, Star, History, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PointsManager({ members: initialMembers }: { members: Profile[] }) {
  const [members, setMembers]   = useState(initialMembers)
  const [selected, setSelected] = useState<string>(initialMembers[0]?.id ?? '')
  const [amount, setAmount]     = useState('')
  const [motivo, setMotivo]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [resetting, setResetting] = useState<string | null>(null)

  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory]         = useState<PontosHistorico[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const router = useRouter()

  useEffect(() => { setMembers(initialMembers) }, [initialMembers])

  // Reload history when member changes (if panel is open)
  useEffect(() => {
    if (showHistory) fetchHistory()
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedMember = members.find(m => m.id === selected)

  async function fetchHistory() {
    setHistoryLoading(true)
    const res = await fetch(`/api/admin/points?userId=${selected}`)
    const data = await res.json()
    if (res.ok) setHistory(data.historico)
    setHistoryLoading(false)
  }

  async function toggleHistory() {
    const next = !showHistory
    setShowHistory(next)
    if (next) fetchHistory()
  }

  async function handlePoints(positive: boolean) {
    const pts = parseInt(amount)
    if (!pts || isNaN(pts) || pts <= 0) return toast.error('Informe um valor válido')
    if (!motivo.trim()) return toast.error('Informe o motivo')
    setLoading(true)
    const delta = positive ? pts : -pts
    const res = await fetch('/api/admin/points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selected, pontos: delta, motivo }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error)
    else {
      toast.success(`${positive ? '+' : '-'}${pts} pts para ${selectedMember?.name}`)
      setMembers(prev => prev.map(m => m.id === selected ? { ...m, pontos: m.pontos + delta } : m))
      setAmount('')
      setMotivo('')
      if (showHistory) fetchHistory()
      router.refresh()
    }
    setLoading(false)
  }

  async function handleReset(userId: string, name: string) {
    if (!confirm(`Zerar TODOS os pontos e streak de ${name}? Isso não pode ser desfeito.`)) return
    setResetting(userId)
    const res = await fetch('/api/admin/points', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error)
    else {
      toast.success(`Pontos de ${name} zerados`)
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, pontos: 0, streak: 0 } : m))
      if (showHistory && userId === selected) setHistory([])
      router.refresh()
    }
    setResetting(null)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      {/* Add / subtract */}
      <div className="neon-card rounded-2xl border border-[#ffe600]/15 overflow-hidden">
        <div className="h-px bg-gradient-to-r from-transparent via-[#ffe600]/40 to-transparent" />
        <div className="p-5 space-y-4">
          <p className="text-[10px] font-semibold text-[#ffe600] uppercase tracking-wider flex items-center gap-2">
            <Star className="h-3.5 w-3.5" /> Adicionar / Remover Pontos
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {members.map(m => {
              const initials = m.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
              const isActive = selected === m.id
              return (
                <button key={m.id} onClick={() => setSelected(m.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                    isActive ? 'border-[#ffe600]/40 bg-[#ffe600]/10' : 'border-white/[0.07] hover:border-white/20'
                  }`}>
                  <Avatar className="h-7 w-7 shrink-0">
                    {m.avatar_url && <AvatarImage src={m.avatar_url} alt={m.name} />}
                    <AvatarFallback className="bg-[#0a0a20] text-[10px] font-bold" style={{ color: isActive ? '#ffe600' : '#6666aa' }}>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium truncate ${isActive ? 'text-[#ffe600]' : 'text-[#8888aa]'}`}>{m.name.split(' ')[0]}</p>
                    <p className="text-[10px] text-[#444466] font-mono">{m.pontos} pts</p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex gap-2">
            <Input
              type="number" min="1" placeholder="Pontos"
              value={amount} onChange={e => setAmount(e.target.value)}
              className="neon-input h-9 text-sm w-28 shrink-0"
            />
            <Input
              placeholder="Motivo (ex: participação extra)"
              value={motivo} onChange={e => setMotivo(e.target.value)}
              className="neon-input h-9 text-sm flex-1"
            />
          </div>

          <div className="flex gap-2">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => handlePoints(true)} disabled={loading || !amount || !motivo.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors disabled:opacity-40">
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => handlePoints(false)} disabled={loading || !amount || !motivo.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#ff0055]/10 border border-[#ff0055]/30 text-[#ff0055] hover:bg-[#ff0055]/20 transition-colors disabled:opacity-40">
              <Minus className="h-3.5 w-3.5" /> Remover
            </motion.button>
          </div>
        </div>
      </div>

      {/* Histórico */}
      <div className="neon-card rounded-2xl border border-white/[0.07] overflow-hidden">
        <button
          onClick={toggleHistory}
          className="w-full flex items-center justify-between px-5 py-3 border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="h-3.5 w-3.5 text-[#6666aa]" />
            <span className="text-[10px] font-semibold text-[#6666aa] uppercase tracking-wider">
              Histórico de {selectedMember?.name.split(' ')[0]}
            </span>
          </div>
          {showHistory ? <ChevronUp className="h-3.5 w-3.5 text-[#444466]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#444466]" />}
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <span className="h-5 w-5 rounded-full border border-[#ffe600]/40 border-t-[#ffe600] animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-center text-xs text-[#333355] py-6">Nenhum registro encontrado</p>
              ) : (
                <div className="divide-y divide-white/[0.04] max-h-64 overflow-y-auto">
                  {history.map(h => (
                    <div key={h.id} className="flex items-center gap-3 px-5 py-2.5">
                      <span className={`text-sm font-bold font-mono shrink-0 ${h.pontos >= 0 ? 'text-[#00ff88]' : 'text-[#ff0055]'}`}>
                        {h.pontos >= 0 ? '+' : ''}{h.pontos}
                      </span>
                      <span className="flex-1 text-xs text-[#8888aa] truncate">{h.motivo}</span>
                      <span className="text-[10px] text-[#333355] shrink-0">{formatDate(h.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ranking */}
      <div className="neon-card rounded-2xl border border-white/[0.07] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.05]">
          <p className="text-[10px] font-semibold text-[#6666aa] uppercase tracking-wider">Ranking atual</p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {[...members].sort((a, b) => b.pontos - a.pontos).map((m, i) => {
            const initials = m.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
            const medal = i === 0 ? 'text-[#ffe600]' : i === 1 ? 'text-[#aaaaaa]' : i === 2 ? 'text-[#ff8800]' : 'text-[#333355]'
            return (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`text-xs font-mono w-5 shrink-0 font-bold ${medal}`}>{i + 1}</span>
                <Avatar className="h-8 w-8 shrink-0">
                  {m.avatar_url && <AvatarImage src={m.avatar_url} alt={m.name} />}
                  <AvatarFallback className="bg-[#0a0a20] text-[#6666aa] text-xs font-bold">{initials}</AvatarFallback>
                </Avatar>
                <span className="flex-1 text-sm text-white truncate">{m.name}</span>
                <span className="text-sm font-bold font-mono text-[#ffe600] shrink-0">{m.pontos} pts</span>
                <button onClick={() => handleReset(m.id, m.name)} disabled={resetting === m.id}
                  className="p-1.5 rounded-lg text-[#333355] hover:text-[#ff0055] hover:bg-[#ff0055]/10 transition-colors shrink-0" title="Zerar pontos">
                  {resetting === m.id
                    ? <span className="h-3.5 w-3.5 block rounded-full border border-[#ff0055] border-t-transparent animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
