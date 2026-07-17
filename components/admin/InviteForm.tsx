'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Eye, EyeOff, Copy, Check, KeyRound } from 'lucide-react'

interface CreatedUser {
  name: string
  email: string
  password: string
}

export default function InviteForm() {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [cargo, setCargo]     = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<CreatedUser | null>(null)
  const [copied, setCopied]   = useState(false)

  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) return toast.error('Senha deve ter no mínimo 6 caracteres')

    setLoading(true)
    setCreated(null)
    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, cargo, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || 'Erro ao criar membro')
    } else {
      setCreated({ name, email, password })
      toast.success(`${name} criado com sucesso!`)
      setName(''); setEmail(''); setCargo(''); setPassword('')
      router.refresh()
    }
    setLoading(false)
  }

  async function copyCredentials() {
    if (!created) return
    const text = `Acesso Fonil Group\nEmail: ${created.email}\nSenha: ${created.password}\nhttps://www.dailyflux.site/login`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="neon-card rounded-2xl border border-[#00f0ff]/15 overflow-hidden">
      <div className="h-px bg-gradient-to-r from-transparent via-[#00f0ff]/50 to-transparent" />
      <div className="p-5">
        <p className="text-[10px] font-semibold text-[#00f0ff] uppercase tracking-wider flex items-center gap-2 mb-4">
          <UserPlus className="h-3.5 w-3.5" /> Criar novo membro
        </p>

        <form onSubmit={handleCreate} className="space-y-3">
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

          <div>
            <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Senha inicial *</label>
            <div className="relative mt-1">
              <Input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="neon-input h-9 text-sm pr-10"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444466] hover:text-[#00f0ff] transition-colors">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit" disabled={loading || !name.trim() || !email.trim() || !password}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all disabled:opacity-40 w-full justify-center"
            style={{ boxShadow: '0 0 12px rgba(0,240,255,0.1)' }}
          >
            <UserPlus className="h-4 w-4" />
            {loading ? 'Criando...' : 'Criar membro'}
          </motion.button>
        </form>

        {/* Credenciais geradas */}
        <AnimatePresence>
          {created && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="rounded-xl border border-[#00ff88]/20 bg-[#00ff88]/[0.03] p-3 space-y-2">
                <p className="text-[10px] font-semibold text-[#00ff88] flex items-center gap-1.5">
                  <KeyRound className="h-3 w-3" />
                  Membro criado! Compartilhe as credenciais abaixo:
                </p>
                <div className="space-y-1 text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[#444466] w-12 shrink-0">Email</span>
                    <span className="text-white">{created.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#444466] w-12 shrink-0">Senha</span>
                    <span className="text-white">{created.password}</span>
                  </div>
                </div>
                <button
                  onClick={copyCredentials}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all w-full justify-center mt-1"
                  style={copied
                    ? { borderColor: 'rgba(0,255,136,0.4)', color: '#00ff88', background: 'rgba(0,255,136,0.1)' }
                    : { borderColor: 'rgba(255,255,255,0.1)', color: '#8888aa', background: 'rgba(255,255,255,0.03)' }
                  }
                >
                  {copied ? <><Check className="h-3 w-3" /> Copiado!</> : <><Copy className="h-3 w-3" /> Copiar credenciais para WhatsApp</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
