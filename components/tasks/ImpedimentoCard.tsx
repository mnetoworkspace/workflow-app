'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Impedimento, PONTOS } from '@/types'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export default function ImpedimentoCard({ impedimento, userId, date }: { impedimento: Impedimento | null; userId: string; date: string }) {
  const [temImpedimento, setTemImpedimento] = useState(impedimento ? impedimento.descricao !== null : false)
  const [descricao, setDescricao] = useState(impedimento?.descricao ?? '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const jaSalvou = !!impedimento

  async function handleSave() {
    setLoading(true)
    const payload = { user_id: userId, data: date, descricao: temImpedimento ? descricao.trim() || null : null }
    const { error } = impedimento
      ? await supabase.from('impedimentos').update({ descricao: payload.descricao }).eq('id', impedimento.id)
      : await supabase.from('impedimentos').insert(payload)

    if (error) { toast.error('Erro ao salvar') }
    else {
      if (temImpedimento && descricao.trim() && !jaSalvou) {
        await supabase.from('pontos_historico').insert({ user_id: userId, pontos: PONTOS.IMPEDIMENTO_DESCRITO, motivo: 'Impedimento registrado' })
        await supabase.rpc('increment_pontos', { uid: userId, amount: PONTOS.IMPEDIMENTO_DESCRITO })
        toast.success('Impedimento registrado! +5 pts')
      } else { toast.success('Salvo!') }
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="neon-card rounded-xl p-4 border border-[#ff8800]/15 bg-[#ff8800]/02">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="h-4 w-4 text-[#ff8800]" style={{ filter: 'drop-shadow(0 0 6px #ff8800)' }} />
        <span className="text-xs font-semibold text-[#ff8800] uppercase tracking-wider">Impedimentos</span>
      </div>

      <div className="flex gap-2 mb-3">
        {[false, true].map((val) => (
          <button
            key={String(val)}
            onClick={() => setTemImpedimento(val)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-all',
              temImpedimento === val
                ? val
                  ? 'bg-[#ff8800]/15 border-[#ff8800]/40 text-[#ff8800]'
                  : 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]'
                : 'border-white/[0.06] text-[#444466] hover:text-[#8888aa]'
            )}
          >
            {val ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
            {val ? 'Tive bloqueio' : 'Tudo certo'}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {temImpedimento && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-3"
          >
            <Textarea
              placeholder="Descreva o bloqueio..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="neon-input resize-none text-sm"
              rows={3}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleSave}
        disabled={loading || (temImpedimento && !descricao.trim())}
        className="text-sm px-4 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#8888aa] hover:text-white hover:border-white/20 transition-all disabled:opacity-40"
      >
        {loading ? '...' : jaSalvou ? 'Atualizar' : 'Salvar'}
      </button>
    </div>
  )
}
