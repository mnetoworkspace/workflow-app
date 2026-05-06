'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { toast.error('Email ou senha incorretos'); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center tech-bg relative overflow-hidden p-4">
      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,240,255,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(180,75,255,0.06) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center gap-2 mb-3"
          >
            <Zap className="h-7 w-7 text-[#00f0ff]" style={{ filter: 'drop-shadow(0 0 12px #00f0ff)' }} />
            <span className="text-3xl font-bold text-white tracking-widest text-glow-cyan">DAILYFLUX</span>
          </motion.div>
          <p className="text-[#444466] text-xs tracking-[0.3em] uppercase">Squad Raiz · Atividades e Dailies</p>
        </div>

        {/* Card */}
        <div className="neon-card rounded-2xl p-6 border border-[#00f0ff]/15" style={{ boxShadow: '0 0 40px rgba(0,240,255,0.06), 0 0 80px rgba(180,75,255,0.04)' }}>
          {/* Top accent line */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#00f0ff]/60 to-transparent -mx-6 mb-6" />

          <h2 className="text-lg font-semibold text-white mb-1">Acessar</h2>
          <p className="text-[#444466] text-xs mb-5">Entre para gerenciar suas dailies</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-[#6666aa] uppercase tracking-wider">Email</Label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="neon-input h-10 rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-semibold text-[#6666aa] uppercase tracking-wider">Senha</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="neon-input h-10 rounded-lg text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444466] hover:text-[#00f0ff] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-10 rounded-lg text-sm font-semibold bg-[#00f0ff] text-[#05050f] hover:bg-[#00d4e0] transition-colors disabled:opacity-50 mt-2"
              style={{ boxShadow: '0 0 20px rgba(0,240,255,0.3)' }}
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-[#05050f] border-t-transparent animate-spin" />
                    Entrando...
                  </span>
                : 'Entrar'
              }
            </motion.button>
          </form>

          <div className="h-px bg-gradient-to-r from-transparent via-[#b44bff]/40 to-transparent -mx-6 mt-6" />
        </div>
      </motion.div>
    </div>
  )
}
