'use client'

import { Entrega, Profile, ENTREGA_STATUS_LABELS, ENTREGA_STATUS_COLORS, KANBAN_COLUNAS, PRIORIDADE_ORDEM } from '@/types'
import EntregaCard from './EntregaCard'

export default function ProducaoBoard({
  entregas,
  perfis,
  userId,
  isAdmin,
  showCliente = false,
}: {
  entregas: Entrega[]
  perfis: Profile[]
  userId: string
  isAdmin: boolean
  showCliente?: boolean
}) {
  function ordenar(lista: Entrega[]) {
    return [...lista].sort((a, b) => {
      const prio = PRIORIDADE_ORDEM[a.prioridade] - PRIORIDADE_ORDEM[b.prioridade]
      if (prio !== 0) return prio
      if (a.prazo && b.prazo) return a.prazo.localeCompare(b.prazo)
      if (a.prazo) return -1
      if (b.prazo) return 1
      return a.created_at.localeCompare(b.created_at)
    })
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
      {KANBAN_COLUNAS.map(status => {
        const daColuna = ordenar(entregas.filter(e => e.status === status))
        const color = ENTREGA_STATUS_COLORS[status]
        return (
          <div key={status} className="w-64 sm:w-72 shrink-0 snap-start">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
                {ENTREGA_STATUS_LABELS[status]}
              </p>
              <span className="text-[10px] text-[#6666aa] ml-auto">{daColuna.length}</span>
            </div>

            <div className="space-y-2 rounded-2xl border border-white/[0.05] bg-white/[0.01] p-2 min-h-24">
              {daColuna.length === 0 ? (
                <p className="text-[10px] text-[#444466] text-center py-6">Vazio</p>
              ) : (
                daColuna.map(entrega => (
                  <EntregaCard
                    key={entrega.id}
                    entrega={entrega}
                    perfis={perfis}
                    userId={userId}
                    isAdmin={isAdmin}
                    showCliente={showCliente}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
