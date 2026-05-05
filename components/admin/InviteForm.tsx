'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, UserPlus } from 'lucide-react'

export default function InviteForm() {
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [cargo, setCargo] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
    else { toast.success(`Convite enviado para ${email}!`); setName(''); setEmail(''); setCargo(''); router.refresh() }
    setLoading(false)
  }

  return (
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
  )
}
