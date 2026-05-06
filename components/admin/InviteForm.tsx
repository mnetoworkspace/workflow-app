'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, UserPlus, Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'

interface PendingInvite {
  id: string
  email: string
  name: string
  cargo: string | null
  invited_at: string
}

export default function InviteForm() {
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [cargo, setCargo] = useState('')
  const [loading, setLoading] = useState(false)

  const [pending, setPending]           = useState<PendingInvite[]>([])
  const [showPending, setShowPending]   = useState(false)
  const [loadingPending, setLoadingPending] = useState(false)
  const [resending, setResending]       = useState<string | null>(null)

  const router = useRouter()

  const fetchPending = useCallback(async () => {
    setLoadingPending(true)
    const res = await fetch('/api/admin/invite')
    const data = await res.json()
    if (res.ok) setPending(data.pending ?? [])
    setLoadingPending(false)
  }, [])

  useEffect(() => {
    if (showPending) fetchPending()
  }, [showPending, fetchPending])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, cargo }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error || 'Erro ao enviar convite')
    else {
      toast.success(`Convite enviado para ${email}!`)
      setName(''); setEmail(''); setCargo('')
      if (showPending) fetchPending()
      router.refresh()
    }
    setLoading(false)
  }

  async function handleResend(invite: PendingInvite) {
    setResending(invite.email)
    const res = await fetch('/api/admin/invite', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: invite.email }),
    })
    const data = await res.json()
    if (!res.ok) toast.error(data.error || 'Erro ao reenviar')
    else toast.success(`Convite reenviado para ${invite.email}!`)
    setResending(null)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      {/* Formulário de convite */}
      <div className="neon-card rounded-2xl border border-[#00f0ff]/15 overflow-hidden">
        <div className="h-px bg-gradient-to-r from-transparent via-[#00f0ff]/50 to-transparent" />
        <div className="p-5">
          <p className="text-[10px] font-semibold text-[#00f0ff] uppercase tracking-wider flex items-center gap-2 mb-4">
            <UserPlus className="h-3.5 w-3.5" /> Convidar novo membro
          </p>
          <form onSubmit={handleInvite} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Nome completo *</label>
                <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Ex: Heitor Silva" className="neon-input mt-1 h-9 text-sm" />
              </div>
              <div>
                <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Cargo</label>
                <Input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Ex: Designer" className="neon-input mt-1 h-9 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Email *</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="email@exemplo.com" className="neon-input mt-1 h-9 text-sm" />
            </div>
            <motion.button
              type="submit"
              disabled={loading || !name.trim() || !email.trim()}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all disabled:opacity-40 w-full justify-center"
              style={{ boxShadow: '0 0 12px rgba(0,240,255,0.1)' }}
            >
              <Mail className="h-4 w-4" />
              {loading ? 'Enviando...' : 'Enviar convite por email'}
            </motion.button>
          </form>
          <p className="text-[10px] text-[#333355] mt-3">
            O colaborador receberá um email com link para definir a própria senha.
          </p>
        </div>
      </div>

      {/* Convites pendentes */}
      <div className="neon-card rounded-2xl border border-white/[0.07] overflow-hidden">
        <button
          onClick={() => setShowPending(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-[#6666aa]" />
            <span className="text-[10px] font-semibold text-[#6666aa] uppercase tracking-wider">
              Convites pendentes
            </span>
            {pending.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#ff8800]/20 text-[#ff8800] font-bold">
                {pending.length}
              </span>
            )}
          </div>
          {showPending ? <ChevronUp className="h-3.5 w-3.5 text-[#444466]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#444466]" />}
        </button>

        <AnimatePresence>
          {showPending && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-white/[0.05]"
            >
              {loadingPending ? (
                <div className="flex justify-center py-8">
                  <span className="h-5 w-5 rounded-full border border-[#00f0ff]/40 border-t-[#00f0ff] animate-spin" />
                </div>
              ) : pending.length === 0 ? (
                <p className="text-center text-xs text-[#333355] py-6">Nenhum convite pendente</p>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {pending.map(invite => (
                    <div key={invite.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{invite.name}</p>
                        <p className="text-[11px] text-[#444466] truncate">{invite.email}</p>
                        {invite.cargo && <p className="text-[10px] text-[#333355]">{invite.cargo}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-[#333355] mb-1.5">
                          Enviado {formatDate(invite.invited_at)}
                        </p>
                        <button
                          onClick={() => handleResend(invite)}
                          disabled={resending === invite.email}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium text-[#00f0ff] border border-[#00f0ff]/25 bg-[#00f0ff]/05 hover:bg-[#00f0ff]/15 transition-all disabled:opacity-40"
                        >
                          {resending === invite.email
                            ? <span className="h-3 w-3 rounded-full border border-[#00f0ff] border-t-transparent animate-spin" />
                            : <RefreshCw className="h-3 w-3" />
                          }
                          Reenviar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
