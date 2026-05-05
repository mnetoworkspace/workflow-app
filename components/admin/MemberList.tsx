'use client'

import { useState, useEffect } from 'react'
import { Profile, getNivel, UserRole } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Flame, Star, Users, Shield, Pencil, Trash2, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type EditState = { name: string; cargo: string; role: UserRole }

export default function MemberList({ members: initialMembers, currentUserId }: { members: Profile[]; currentUserId: string }) {
  const [members, setMembers] = useState(initialMembers)
  const [editing, setEditing]   = useState<string | null>(null)
  const [editData, setEditData] = useState<EditState>({ name: '', cargo: '', role: 'collaborator' })
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => { setMembers(initialMembers) }, [initialMembers])

  function startEdit(m: Profile) {
    setEditing(m.id)
    setEditData({ name: m.name, cargo: m.cargo ?? '', role: m.role })
  }

  async function saveEdit(userId: string) {
    if (!editData.name.trim()) return toast.error('Nome não pode ser vazio')
    setSaving(true)
    const res = await fetch('/api/admin/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, name: editData.name, cargo: editData.cargo, role: editData.role }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error)
    } else {
      setMembers(prev => prev.map(m => m.id === userId
        ? { ...m, name: editData.name.trim(), cargo: editData.cargo.trim() || null, role: editData.role }
        : m
      ))
      setEditing(null)
      toast.success('Membro atualizado')
      router.refresh()
    }
    setSaving(false)
  }

  async function deleteMember(userId: string, name: string) {
    if (!confirm(`Remover ${name} do sistema? Todos os dados deste membro serão excluídos permanentemente.`)) return
    setDeleting(userId)
    const res = await fetch('/api/admin/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error)
    } else {
      setMembers(prev => prev.filter(m => m.id !== userId))
      toast.success(`${name} removido`)
      router.refresh()
    }
    setDeleting(null)
  }

  return (
    <div className="neon-card rounded-2xl border border-[#b44bff]/15 overflow-hidden">
      <div className="h-px bg-gradient-to-r from-transparent via-[#b44bff]/50 to-transparent" />
      <div className="px-5 py-3 border-b border-white/[0.05] flex items-center gap-2">
        <Users className="h-3.5 w-3.5 text-[#b44bff]" />
        <span className="text-[10px] font-semibold text-[#b44bff] uppercase tracking-wider">
          Membros do time — {members.length}
        </span>
      </div>

      <div className="divide-y divide-white/[0.04]">
        <AnimatePresence mode="sync">
          {members.map(m => {
            const initials = m.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
            const isYou     = m.id === currentUserId
            const isEditing = editing === m.id

            if (isEditing) {
              return (
                <motion.div key={`edit-${m.id}`}
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="px-5 py-4 bg-[#b44bff]/[0.04] space-y-2.5">
                  {/* Row 1: inputs */}
                  <div className="flex gap-2">
                    <input
                      value={editData.name}
                      onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                      placeholder="Nome completo"
                      className="neon-input flex-1 text-sm h-8"
                      onKeyDown={e => e.key === 'Enter' && saveEdit(m.id)}
                      autoFocus
                    />
                    <input
                      value={editData.cargo}
                      onChange={e => setEditData(d => ({ ...d, cargo: e.target.value }))}
                      placeholder="Cargo"
                      className="neon-input w-32 text-sm h-8"
                      onKeyDown={e => e.key === 'Enter' && saveEdit(m.id)}
                    />
                  </div>
                  {/* Row 2: role toggle + actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[#6666aa] uppercase tracking-wider">Papel:</span>
                      <button
                        onClick={() => setEditData(d => ({ ...d, role: d.role === 'admin' ? 'collaborator' : 'admin' }))}
                        className={`text-[10px] px-2 py-1 rounded border transition-all flex items-center gap-1 ${
                          editData.role === 'admin'
                            ? 'border-[#b44bff]/40 bg-[#b44bff]/10 text-[#b44bff]'
                            : 'border-white/10 bg-white/[0.03] text-[#6666aa] hover:border-white/20'
                        }`}
                      >
                        <Shield className="h-2.5 w-2.5" />
                        {editData.role === 'admin' ? 'Admin' : 'Colaborador'}
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditing(null)}
                        className="p-1.5 rounded-lg text-[#444466] hover:text-white hover:bg-white/10 transition-colors" title="Cancelar">
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => saveEdit(m.id)} disabled={saving || !editData.name.trim()}
                        className="p-1.5 rounded-lg text-[#00ff88] hover:bg-[#00ff88]/10 transition-colors disabled:opacity-40" title="Salvar">
                        {saving
                          ? <span className="h-3.5 w-3.5 block rounded-full border border-[#00ff88] border-t-transparent animate-spin" />
                          : <Check className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            }

            return (
              <motion.div key={m.id} layout
                className="flex items-center gap-3 px-5 py-4 group hover:bg-white/[0.015] transition-colors">
                <Avatar className="h-9 w-9 shrink-0">
                  {m.avatar_url && <AvatarImage src={m.avatar_url} alt={m.name} />}
                  <AvatarFallback className="bg-[#0a0a20] text-[#6666aa] text-xs font-bold">{initials}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{m.name}</span>
                    {isYou && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20">você</span>
                    )}
                    {m.role === 'admin' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#b44bff]/10 text-[#b44bff] border border-[#b44bff]/20 flex items-center gap-1">
                        <Shield className="h-2.5 w-2.5" />admin
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {m.cargo && <span className="text-[11px] text-[#444466]">{m.cargo}</span>}
                    {m.cargo && <span className="text-[11px] text-[#333355]">·</span>}
                    <span className="text-[11px] text-[#333355]">{getNivel(m.pontos)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs shrink-0">
                  <div className="flex items-center gap-1">
                    <Flame className="h-3 w-3 text-[#ff8800]" />
                    <span className="text-[#ff8800] font-mono">{m.streak}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-[#ffe600]" />
                    <span className="text-[#ffe600] font-mono">{m.pontos}</span>
                  </div>
                </div>

                {/* Actions — visible on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => startEdit(m)}
                    className="p-1.5 rounded-lg text-[#6666aa] hover:text-[#b44bff] hover:bg-[#b44bff]/10 transition-colors"
                    title="Editar">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {!isYou && (
                    <button
                      onClick={() => deleteMember(m.id, m.name)}
                      disabled={deleting === m.id}
                      className="p-1.5 rounded-lg text-[#333355] hover:text-[#ff0055] hover:bg-[#ff0055]/10 transition-colors disabled:opacity-40"
                      title="Remover membro">
                      {deleting === m.id
                        ? <span className="h-3.5 w-3.5 block rounded-full border border-[#ff0055] border-t-transparent animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
