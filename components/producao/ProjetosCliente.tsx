'use client'

import { useState } from 'react'
import {
  Cliente, Projeto, Entrega, Profile,
  PROJETO_TIPO_LABELS, PROJETO_STATUS_LABELS,
} from '@/types'
import ProjetoForm from './ProjetoForm'
import EntregaForm from './EntregaForm'
import ProducaoBoard from './ProducaoBoard'
import { Plus, FolderKanban, ChevronDown, Pencil, Package } from 'lucide-react'

const PROJETO_STATUS_COLORS: Record<Projeto['status'], string> = {
  ativo: '#00ff88',
  pausado: '#ff8800',
  concluido: '#00f0ff',
  cancelado: '#6666aa',
}

export default function ProjetosCliente({
  cliente,
  projetos,
  perfis,
  userId,
}: {
  cliente: Cliente
  projetos: Projeto[]
  perfis: Profile[]
  userId: string
}) {
  const [abertos, setAbertos] = useState<Set<string>>(
    () => new Set(projetos.filter(p => p.status === 'ativo').map(p => p.id))
  )
  const isAdmin = perfis.find(p => p.id === userId)?.role === 'admin'

  function toggle(id: string) {
    setAbertos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-[#00ff88] uppercase tracking-wider flex items-center gap-2">
          <FolderKanban className="h-3.5 w-3.5" /> Projetos ({projetos.length})
        </p>
        <div className="flex items-center gap-2">
          {/* Cria a entrega direto no cliente — vai para o projeto "Geral" automaticamente */}
          <EntregaForm
            clienteId={cliente.id}
            perfis={perfis}
            userId={userId}
            trigger={
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#b44bff]/10 border border-[#b44bff]/30 text-[#b44bff] hover:bg-[#b44bff]/20 transition-all">
                <Package className="h-3 w-3" /> Nova Entrega
              </button>
            }
          />
          <ProjetoForm
            clienteId={cliente.id}
            perfis={perfis}
            trigger={
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/20 transition-all">
                <Plus className="h-3 w-3" /> Novo Projeto
              </button>
            }
          />
        </div>
      </div>

      {projetos.length === 0 ? (
        <div className="neon-card rounded-2xl border border-white/[0.06] p-8 text-center">
          <FolderKanban className="h-6 w-6 text-[#6666aa] mx-auto mb-2" />
          <p className="text-sm text-[#8888aa]">Nenhum projeto para este cliente ainda.</p>
        </div>
      ) : (
        projetos.map(projeto => {
          const entregas = (projeto.entregas ?? []) as Entrega[]
          const aberto = abertos.has(projeto.id)
          const statusColor = PROJETO_STATUS_COLORS[projeto.status]
          const pendentes = entregas.filter(e => e.status !== 'entregue' && e.status !== 'cancelada').length

          return (
            <div key={projeto.id} className="neon-card rounded-2xl border border-white/[0.06] overflow-hidden">
              <button
                onClick={() => toggle(projeto.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <ChevronDown className={`h-4 w-4 text-[#6666aa] transition-transform shrink-0 ${aberto ? '' : '-rotate-90'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{projeto.nome}</p>
                  <p className="text-[11px] text-[#6666aa]">
                    {PROJETO_TIPO_LABELS[projeto.tipo]}
                    {projeto.responsavel ? ` · ${projeto.responsavel.name.split(' ')[0]}` : ''}
                    {` · ${pendentes} pendente${pendentes === 1 ? '' : 's'}`}
                  </p>
                </div>
                <span
                  className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0"
                  style={{ color: statusColor, borderColor: `${statusColor}40`, background: `${statusColor}10` }}
                >
                  {PROJETO_STATUS_LABELS[projeto.status]}
                </span>
              </button>

              {aberto && (
                <div className="px-4 pb-4 space-y-3">
                  {projeto.descricao && (
                    <p className="text-xs text-[#8888aa] whitespace-pre-wrap">{projeto.descricao}</p>
                  )}

                  <div className="flex items-center gap-2">
                    <EntregaForm
                      projetoId={projeto.id}
                      perfis={perfis}
                      userId={userId}
                      trigger={
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#b44bff]/10 border border-[#b44bff]/30 text-[#b44bff] hover:bg-[#b44bff]/20 transition-all">
                          <Package className="h-3 w-3" /> Nova Entrega
                        </button>
                      }
                    />
                    <ProjetoForm
                      clienteId={cliente.id}
                      projeto={projeto}
                      perfis={perfis}
                      trigger={
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.03] border border-white/[0.08] text-[#8888aa] hover:text-white transition-all">
                          <Pencil className="h-3 w-3" /> Editar
                        </button>
                      }
                    />
                  </div>

                  <ProducaoBoard
                    entregas={entregas}
                    perfis={perfis}
                    userId={userId}
                    isAdmin={isAdmin}
                  />
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
