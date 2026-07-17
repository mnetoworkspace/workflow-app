'use client'

import { useState } from 'react'
import { CheckCheck, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Admin encerra o dia: concede bônus da daily (participação, tudo concluído,
// zero postergadas) e atualiza os streaks de todo mundo. Uma vez por data.
export default function FecharDiaButton({ today, jaFechado }: { today: string; jaFechado: boolean }) {
  const [loading, setLoading] = useState(false)
  const [fechado, setFechado] = useState(jaFechado)
  const router = useRouter()

  async function fecharDia() {
    if (!confirm('Encerrar o dia? Bônus e streaks serão processados para todos. Isso só pode ser feito uma vez por dia.')) return
    setLoading(true)
    const res = await fetch('/api/daily/fechar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: today }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error ?? 'Erro ao encerrar o dia')
    } else {
      const comPontos = (json.resumo ?? []).filter((r: { pontos: number }) => r.pontos > 0)
      toast.success(`Dia encerrado! ${comPontos.length} membro${comPontos.length === 1 ? '' : 's'} pontuaram 🎉`)
      setFechado(true)
      router.refresh()
    }
    setLoading(false)
  }

  if (fechado) {
    return (
      <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#00ff88] border border-[#00ff88]/25 bg-[#00ff88]/08">
        <Lock className="h-3.5 w-3.5" />
        Dia encerrado
      </span>
    )
  }

  return (
    <button
      onClick={fecharDia}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-[#b44bff] border border-[#b44bff]/30 bg-[#b44bff]/10 hover:bg-[#b44bff]/20 transition-all disabled:opacity-50"
    >
      <CheckCheck className="h-3.5 w-3.5" />
      {loading ? 'Encerrando...' : 'Encerrar dia'}
    </button>
  )
}
