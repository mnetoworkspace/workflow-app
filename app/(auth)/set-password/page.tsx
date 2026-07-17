'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [ready, setReady]       = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const access_token  = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (access_token && refresh_token) {
      // Link de convite — tokens vêm no hash fragment
      supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
        if (error) { toast.error('Link inválido ou expirado'); router.replace('/login') }
        else setReady(true)
      })
    } else {
      // Fallback: sessão já existente (ex: vindo do auth/callback)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setReady(true)
        else { toast.error('Link inválido ou expirado'); router.replace('/login') }
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) return toast.error('As senhas não coincidem')
    if (password.length < 6)  return toast.error('Mínimo 6 caracteres')

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    toast.success('Senha definida! Bem-vindo à Fonil Group!')
    router.push('/dashboard')
    router.refresh()
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center tech-bg">
        <span className="h-8 w-8 rounded-full border-2 border-[#00f0ff]/40 border-t-[#00f0ff] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center tech-bg relative overflow-hidden p-4">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(180,75,255,0.06) 0%, transparent 70%)' }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex flex-col items-center gap-3 mb-3">
            <img
              src="/logo-fonil.webp"
              alt="Fonil Group"
              className="h-24 w-auto"
              style={{ filter: 'drop-shadow(0 0 24px rgba(111,242,3,0.25))' }}
            />
            <span className="text-lg font-bold text-white tracking-[0.35em] text-glow-fonil">GROUP</span>
          </motion.div>
          <p className="text-[#444466] text-xs tracking-[0.3em] uppercase">Atividades e Dailies</p>
        </div>

        {/* Card */}
        <div className="neon-card rounded-2xl p-6 border border-[#b44bff]/15"
          style={{ boxShadow: '0 0 40px rgba(180,75,255,0.06), 0 0 80px rgba(0,240,255,0.03)' }}>
          <div className="h-px bg-gradient-to-r from-transparent via-[#b44bff]/60 to-transparent -mx-6 mb-6" />

          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="h-4 w-4 text-[#b44bff]" />
            <h2 className="text-lg font-semibold text-white">Definir senha</h2>
          </div>
          <p className="text-[#444466] text-xs mb-5">Escolha uma senha para acessar o sistema</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-[#6666aa] uppercase tracking-wider">Nova senha</Label>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required minLength={6}
                  className="neon-input h-10 rounded-lg text-sm pr-10"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444466] hover:text-[#b44bff] transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-[#6666aa] uppercase tracking-wider">Confirmar senha</Label>
              <Input
                type={showPw ? 'text' : 'password'}
                placeholder="Repita a senha"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className="neon-input h-10 rounded-lg text-sm"
              />
            </div>

            <motion.button type="submit" disabled={loading || !password || !confirm}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="w-full h-10 rounded-lg text-sm font-semibold bg-[#b44bff] text-white hover:bg-[#9a35e0] transition-colors disabled:opacity-50 mt-2"
              style={{ boxShadow: '0 0 20px rgba(180,75,255,0.3)' }}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Salvando...
                  </span>
                : 'Definir senha e entrar'
              }
            </motion.button>
          </form>

          <div className="h-px bg-gradient-to-r from-transparent via-[#00f0ff]/40 to-transparent -mx-6 mt-6" />
        </div>
      </motion.div>
    </div>
  )
}
