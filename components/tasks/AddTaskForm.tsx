'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Cliente, Entrega, TaskComplexidade,
  COMPLEXIDADE_LABELS, COMPLEXIDADE_COLORS, PONTOS_COMPLEXIDADE,
} from '@/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, ListPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const COMPLEXIDADES: TaskComplexidade[] = ['leve', 'media', 'pesada']

export default function AddTaskForm({ userId, date, clientes = [] }: { userId: string; date: string; clientes?: Cliente[] }) {
  const [titulo, setTitulo] = useState('')
  const [complexidade, setComplexidade] = useState<TaskComplexidade>('media')
  const [lote, setLote] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clienteId, setClienteId] = useState('')
  const [entregaId, setEntregaId] = useState('')
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const router = useRouter()
  const supabase = createClient()

  async function selecionarCliente(id: string) {
    setClienteId(id)
    setEntregaId('')
    setEntregas([])
    if (!id) return
    const { data } = await supabase
      .from('entregas')
      .select('*, projeto:projetos!inner(cliente_id)')
      .eq('projeto.cliente_id', id)
      .in('status', ['backlog', 'em_producao', 'revisao'])
      .order('created_at', { ascending: false })
    setEntregas((data ?? []) as Entrega[])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Modo lote: cada linha vira uma task (mesma complexidade e cliente)
    const titulos = lote
      ? titulo.split('\n').map(l => l.trim()).filter(Boolean)
      : [titulo.trim()].filter(Boolean)
    if (titulos.length === 0) return
    setLoading(true)
    const { error } = await supabase.from('tasks').insert(
      titulos.map(t => ({
        user_id: userId,
        titulo: t,
        data: date,
        status: 'em_andamento',
        complexidade,
        cliente_id: clienteId || null,
        entrega_id: entregaId || null,
      }))
    )
    if (error) { toast.error('Erro ao adicionar') }
    else {
      setTitulo(''); setComplexidade('media')
      toast.success(titulos.length === 1 ? 'Tarefa adicionada!' : `${titulos.length} tarefas adicionadas!`)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        {lote ? (
          <Textarea
            placeholder={'Uma tarefa por linha...\nEx:\nCriar 3 stories\nResponder cliente X\nRevisar site'}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="neon-input rounded-lg text-sm flex-1 min-h-24"
          />
        ) : (
          <Input
            placeholder="+ Nova tarefa para hoje..."
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="neon-input h-10 rounded-lg text-sm flex-1"
          />
        )}
        <button
          type="button"
          onClick={() => setLote(v => !v)}
          title={lote ? 'Voltar para tarefa única' : 'Adicionar várias de uma vez (uma por linha)'}
          className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors shrink-0 ${
            lote
              ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/30'
              : 'bg-white/[0.02] text-[#444466] border-white/[0.08] hover:text-[#00ff88] hover:border-[#00ff88]/30'
          }`}
        >
          <ListPlus className="h-3.5 w-3.5" />
        </button>
        <motion.button
          type="submit"
          disabled={loading || !titulo.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 px-4 h-10 rounded-lg text-sm font-medium bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 hover:bg-[#00f0ff]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          style={{ boxShadow: titulo.trim() ? '0 0 12px rgba(0,240,255,0.2)' : 'none' }}
        >
          <Plus className="h-3.5 w-3.5" />
          {loading ? '...' : 'Add'}
        </motion.button>
      </div>

      {/* Complexidade (define os pontos) + destino: interno ou cliente */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {COMPLEXIDADES.map(c => {
          const color = COMPLEXIDADE_COLORS[c]
          const ativa = complexidade === c
          return (
            <button
              key={c}
              type="button"
              onClick={() => setComplexidade(c)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all"
              style={ativa
                ? { color, borderColor: `${color}50`, background: `${color}12`, boxShadow: `0 0 8px ${color}20` }
                : { color: '#444466', borderColor: 'rgba(255,255,255,0.07)' }}
            >
              {COMPLEXIDADE_LABELS[c]}
              <span className="font-mono">+{PONTOS_COMPLEXIDADE[c]}</span>
            </button>
          )
        })}

        {clientes.length > 0 && (
          <select
            value={clienteId}
            onChange={e => selecionarCliente(e.target.value)}
            className="neon-input h-[26px] text-[10px] rounded-full px-2.5 bg-transparent ml-auto max-w-[50%] truncate"
            style={clienteId ? { color: '#ff0080', borderColor: 'rgba(255,0,128,0.35)' } : undefined}
          >
            <option value="" className="bg-[#0a0a22]">🏠 Interno</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id} className="bg-[#0a0a22]">{c.nome}</option>
            ))}
          </select>
        )}
      </div>

      <AnimatePresence>
        {clienteId && entregas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <select
              value={entregaId}
              onChange={e => setEntregaId(e.target.value)}
              className="neon-input h-9 text-xs rounded-md px-3 bg-transparent w-full"
            >
              <option value="" className="bg-[#0a0a22]">Vincular a uma entrega (opcional)</option>
              {entregas.map(en => (
                <option key={en.id} value={en.id} className="bg-[#0a0a22]">{en.titulo}</option>
              ))}
            </select>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}
