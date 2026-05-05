'use client'

import { useState, useEffect } from 'react'
import { Profile, Badge, BadgeType } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Plus, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

export default function BadgeManager({
  members, allBadges, badgeTypes,
}: {
  members: Profile[]
  allBadges: Badge[]
  badgeTypes: BadgeType[]
}) {
  const [selected, setSelected] = useState<string>(members[0]?.id ?? '')
  const [loading, setLoading]   = useState<string | null>(null)
  const [localBadges, setLocalBadges] = useState<Badge[]>(allBadges)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ emoji: '', label: '', descricao: '' })
  const router = useRouter()

  // Sync when server refreshes the prop
  useEffect(() => { setLocalBadges(allBadges) }, [allBadges])

  const selectedMember = members.find(m => m.id === selected)
  const memberBadges = new Set(localBadges.filter(b => b.user_id === selected).map(b => b.tipo))

  async function toggleBadge(tipo: string) {
    const hasIt = memberBadges.has(tipo)
    setLoading(tipo)

    // Optimistic update
    if (hasIt) {
      setLocalBadges(prev => prev.filter(b => !(b.user_id === selected && b.tipo === tipo)))
    } else {
      setLocalBadges(prev => [...prev, { id: crypto.randomUUID(), user_id: selected, tipo, desbloqueado_em: new Date().toISOString() }])
    }

    const res = await fetch('/api/admin/badges', {
      method: hasIt ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selected, tipo }),
    })
    const data = await res.json()
    if (!res.ok) {
      // Revert on failure
      setLocalBadges(allBadges)
      toast.error(data.error)
    } else {
      toast.success(hasIt ? `Badge removida de ${selectedMember?.name}` : `Badge concedida a ${selectedMember?.name}!`)
      router.refresh()
    }
    setLoading(null)
  }

  async function createBadgeType() {
    if (!form.emoji.trim() || !form.label.trim() || !form.descricao.trim()) {
      toast.error('Preencha emoji, nome e descrição')
      return
    }
    setCreating(true)
    const res = await fetch('/api/admin/badge-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji: form.emoji.trim(), label: form.label.trim(), descricao: form.descricao.trim() }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error)
    else {
      toast.success(`Badge "${form.label}" criada!`)
      setForm({ emoji: '', label: '', descricao: '' })
      setShowCreate(false)
      router.refresh()
    }
    setCreating(false)
  }

  async function deleteBadgeType(tipo: string, label: string) {
    if (!confirm(`Excluir a badge "${label}"? Todos os membros que a possuem perderão também.`)) return
    setLoading(`del_${tipo}`)
    const res = await fetch('/api/admin/badge-types', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error)
    else {
      toast.success(`Badge "${label}" excluída`)
      router.refresh()
    }
    setLoading(null)
  }

  return (
    <div className="space-y-4">
      {/* Create new badge type */}
      <div className="neon-card rounded-2xl border border-[#ff8800]/15 overflow-hidden">
        <div className="h-px bg-gradient-to-r from-transparent via-[#ff8800]/40 to-transparent" />
        <div className="p-5">
          <button
            onClick={() => setShowCreate(v => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <p className="text-[10px] font-semibold text-[#ff8800] uppercase tracking-wider flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" /> Criar Nova Badge
            </p>
            {showCreate
              ? <ChevronUp className="h-3.5 w-3.5 text-[#ff8800]/60" />
              : <ChevronDown className="h-3.5 w-3.5 text-[#ff8800]/60" />
            }
          </button>

          <AnimatePresence>
            {showCreate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-20 shrink-0">
                      <label className="text-[10px] text-[#6666aa] uppercase tracking-wider block mb-1">Emoji</label>
                      <input
                        value={form.emoji}
                        onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                        placeholder="🏆"
                        className="neon-input w-full text-center text-xl py-2"
                        maxLength={4}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-[#6666aa] uppercase tracking-wider block mb-1">Nome</label>
                      <input
                        value={form.label}
                        onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                        placeholder="Nome da badge"
                        className="neon-input w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6666aa] uppercase tracking-wider block mb-1">Descrição</label>
                    <input
                      value={form.descricao}
                      onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                      placeholder="O que é preciso para conquistar essa badge?"
                      className="neon-input w-full"
                    />
                  </div>
                  <button
                    onClick={createBadgeType}
                    disabled={creating}
                    className="w-full py-2 rounded-xl text-sm font-medium text-[#ff8800] border border-[#ff8800]/30 bg-[#ff8800]/10 hover:bg-[#ff8800]/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {creating
                      ? <span className="h-3.5 w-3.5 rounded-full border border-[#ff8800] border-t-transparent animate-spin" />
                      : <Plus className="h-3.5 w-3.5" />
                    }
                    Criar Badge
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Grant / revoke per member */}
      <div className="neon-card rounded-2xl border border-[#ff8800]/15 overflow-hidden">
        <div className="h-px bg-gradient-to-r from-transparent via-[#ff8800]/40 to-transparent" />
        <div className="p-5">
          <p className="text-[10px] font-semibold text-[#ff8800] uppercase tracking-wider flex items-center gap-2 mb-4">
            <Trophy className="h-3.5 w-3.5" /> Gerenciar Badges por Membro
          </p>

          {/* Member selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {members.map(m => {
              const initials = m.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
              const isActive = selected === m.id
              const mBadgeCount = localBadges.filter(b => b.user_id === m.id).length
              return (
                <button key={m.id} onClick={() => setSelected(m.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                    isActive ? 'border-[#ff8800]/40 bg-[#ff8800]/10' : 'border-white/[0.07] hover:border-white/20'
                  }`}>
                  <Avatar className="h-7 w-7 shrink-0">
                    {m.avatar_url && <AvatarImage src={m.avatar_url} alt={m.name} />}
                    <AvatarFallback className="bg-[#0a0a20] text-[10px] font-bold" style={{ color: isActive ? '#ff8800' : '#6666aa' }}>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium truncate ${isActive ? 'text-[#ff8800]' : 'text-[#8888aa]'}`}>{m.name.split(' ')[0]}</p>
                    <p className="text-[10px] text-[#444466]">{mBadgeCount} badges</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Badges list */}
          <p className="text-xs text-[#6666aa] mb-3">
            Badges de <span className="text-white font-medium">{selectedMember?.name}</span> —{' '}
            {memberBadges.size}/{badgeTypes.length} desbloqueadas
          </p>

          {badgeTypes.length === 0 ? (
            <p className="text-xs text-[#444466] text-center py-4">Nenhuma badge cadastrada ainda.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {badgeTypes.map(bt => {
                const has = memberBadges.has(bt.tipo)
                const isToggling = loading === bt.tipo
                const isDeleting = loading === `del_${bt.tipo}`
                return (
                  <motion.div key={bt.tipo} whileHover={{ scale: 1.01 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      has ? 'border-[#ff8800]/25 bg-[#ff8800]/[0.05]' : 'border-white/[0.06] opacity-60'
                    }`}>
                    <span className="text-2xl shrink-0">{bt.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-medium truncate ${has ? 'text-white' : 'text-[#6666aa]'}`}>{bt.label}</p>
                        {bt.is_custom && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-[#ff8800]/15 text-[#ff8800] font-medium shrink-0">custom</span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#333355] truncate">{bt.descricao}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Delete button — only for custom badge types */}
                      {bt.is_custom && (
                        <button
                          onClick={() => deleteBadgeType(bt.tipo, bt.label)}
                          disabled={!!loading}
                          className="p-1.5 rounded-lg text-[#ff0055]/60 hover:text-[#ff0055] hover:bg-[#ff0055]/10 transition-all disabled:opacity-30"
                          title="Excluir badge"
                        >
                          {isDeleting
                            ? <span className="h-3 w-3 block rounded-full border border-current border-t-transparent animate-spin" />
                            : <Trash2 className="h-3 w-3" />
                          }
                        </button>
                      )}
                      {/* Grant / revoke */}
                      <button
                        onClick={() => toggleBadge(bt.tipo)}
                        disabled={!!loading}
                        className={`p-1.5 rounded-lg text-xs transition-all disabled:opacity-40 ${
                          has
                            ? 'text-[#ff0055] hover:bg-[#ff0055]/15 border border-[#ff0055]/20'
                            : 'text-[#00ff88] hover:bg-[#00ff88]/15 border border-[#00ff88]/20'
                        }`}
                        title={has ? 'Revogar' : 'Conceder'}
                      >
                        {isToggling
                          ? <span className="h-3.5 w-3.5 block rounded-full border border-current border-t-transparent animate-spin" />
                          : has ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />
                        }
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
