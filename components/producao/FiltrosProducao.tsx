'use client'

import { Cliente, Profile } from '@/types'
import { useRouter, useSearchParams } from 'next/navigation'

export default function FiltrosProducao({ clientes, perfis }: { clientes: Cliente[]; perfis: Profile[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clienteAtual = searchParams.get('cliente') ?? ''
  const respAtual = searchParams.get('resp') ?? ''

  function aplicar(chave: 'cliente' | 'resp', valor: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (valor) params.set(chave, valor)
    else params.delete(chave)
    router.replace(`/producao${params.size ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={clienteAtual}
        onChange={e => aplicar('cliente', e.target.value)}
        className="neon-input h-9 text-xs rounded-md px-3 bg-transparent"
      >
        <option value="" className="bg-[#0a0a22]">Todos os clientes</option>
        {clientes.map(c => (
          <option key={c.id} value={c.id} className="bg-[#0a0a22]">{c.nome}</option>
        ))}
      </select>

      <select
        value={respAtual}
        onChange={e => aplicar('resp', e.target.value)}
        className="neon-input h-9 text-xs rounded-md px-3 bg-transparent"
      >
        <option value="" className="bg-[#0a0a22]">Todos os responsáveis</option>
        {perfis.map(p => (
          <option key={p.id} value={p.id} className="bg-[#0a0a22]">{p.name}</option>
        ))}
      </select>
    </div>
  )
}
