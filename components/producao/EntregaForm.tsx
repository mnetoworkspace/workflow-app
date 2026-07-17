'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Entrega, EntregaPrioridade, PRIORIDADE_LABELS } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import DateRangeModal from '@/components/ui/date-range-modal'
import { Package } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const PRIORIDADE_OPTIONS: EntregaPrioridade[] = ['baixa', 'media', 'alta', 'urgente']

export default function EntregaForm({
  projetoId,
  clienteId,
  entrega,
  perfis,
  userId,
  trigger,
}: {
  // Passe projetoId para criar dentro de um projeto específico,
  // ou clienteId para criar direto no cliente (usa/cria o projeto "Geral")
  projetoId?: string
  clienteId?: string
  entrega?: Entrega
  perfis: Profile[]
  userId: string
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [titulo, setTitulo] = useState(entrega?.titulo ?? '')
  const [descricao, setDescricao] = useState(entrega?.descricao ?? '')
  const [prioridade, setPrioridade] = useState<EntregaPrioridade>(entrega?.prioridade ?? 'media')
  const [responsavelId, setResponsavelId] = useState(entrega?.responsavel_id ?? '')
  const [prazo, setPrazo] = useState(entrega?.prazo ?? '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function resolverProjetoId(): Promise<string | null> {
    if (projetoId) return projetoId
    if (!clienteId) return null
    // Sem projeto explícito: usa (ou cria) o projeto "Geral" do cliente
    const { data: existente } = await supabase
      .from('projetos')
      .select('id')
      .eq('cliente_id', clienteId)
      .eq('nome', 'Geral')
      .maybeSingle()
    if (existente) return existente.id
    const { data: novo } = await supabase
      .from('projetos')
      .insert({ cliente_id: clienteId, nome: 'Geral', tipo: 'recorrente', status: 'ativo' })
      .select('id')
      .single()
    return novo?.id ?? null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) return
    setLoading(true)

    const pid = entrega?.projeto_id ?? await resolverProjetoId()
    if (!pid) {
      toast.error('Erro ao definir o projeto da entrega')
      setLoading(false)
      return
    }

    const payload = {
      projeto_id: pid,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      prioridade,
      responsavel_id: responsavelId || null,
      prazo: prazo || null,
      ...(entrega ? {} : { created_by: userId }),
    }

    const { error } = entrega
      ? await supabase.from('entregas').update(payload).eq('id', entrega.id)
      : await supabase.from('entregas').insert(payload)

    if (error) {
      toast.error('Erro ao salvar entrega')
    } else {
      toast.success(entrega ? 'Entrega atualizada!' : 'Entrega adicionada ao backlog!')
      if (!entrega) { setTitulo(''); setDescricao(''); setPrioridade('media'); setResponsavelId(''); setPrazo('') }
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="bg-[#0a0a22] border border-[#b44bff]/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Package className="h-4 w-4 text-[#b44bff]" />
            {entrega ? 'Editar entrega' : 'Nova entrega'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Título *</label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} required placeholder="Ex: 3 criativos para stories" className="neon-input mt-1 h-9 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Prioridade</label>
              <select value={prioridade} onChange={e => setPrioridade(e.target.value as EntregaPrioridade)}
                className="neon-input mt-1 h-9 text-sm w-full rounded-md px-3 bg-transparent">
                {PRIORIDADE_OPTIONS.map(p => <option key={p} value={p} className="bg-[#0a0a22]">{PRIORIDADE_LABELS[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Prazo</label>
              <DateRangeModal
                value={{ from: prazo || null, to: prazo || null }}
                onChange={r => setPrazo(r.to ?? r.from ?? '')}
                title="Prazo da entrega"
                placeholder="Sem prazo"
                triggerClassName="mt-1 w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Responsável</label>
            <select value={responsavelId} onChange={e => setResponsavelId(e.target.value)}
              className="neon-input mt-1 h-9 text-sm w-full rounded-md px-3 bg-transparent">
              <option value="" className="bg-[#0a0a22]">Sem responsável</option>
              {perfis.map(p => <option key={p.id} value={p.id} className="bg-[#0a0a22]">{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Descrição</label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Detalhes, referências, links..." className="neon-input mt-1 text-sm min-h-16" />
          </div>

          <motion.button
            type="submit"
            disabled={loading || !titulo.trim()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[#b44bff]/10 border border-[#b44bff]/30 text-[#b44bff] hover:bg-[#b44bff]/20 transition-all disabled:opacity-40 w-full justify-center"
          >
            <Package className="h-4 w-4" />
            {loading ? 'Salvando...' : entrega ? 'Salvar alterações' : 'Criar entrega'}
          </motion.button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
