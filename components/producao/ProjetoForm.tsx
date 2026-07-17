'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, Projeto, ProjetoTipo, ProjetoStatus, PROJETO_TIPO_LABELS, PROJETO_STATUS_LABELS } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import DateRangeModal from '@/components/ui/date-range-modal'
import { FolderKanban } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const TIPO_OPTIONS: ProjetoTipo[] = ['recorrente', 'pontual']
const STATUS_OPTIONS: ProjetoStatus[] = ['ativo', 'pausado', 'concluido', 'cancelado']

export default function ProjetoForm({
  clienteId,
  projeto,
  perfis,
  trigger,
}: {
  clienteId: string
  projeto?: Projeto
  perfis: Profile[]
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState(projeto?.nome ?? '')
  const [descricao, setDescricao] = useState(projeto?.descricao ?? '')
  const [tipo, setTipo] = useState<ProjetoTipo>(projeto?.tipo ?? 'pontual')
  const [status, setStatus] = useState<ProjetoStatus>(projeto?.status ?? 'ativo')
  const [responsavelId, setResponsavelId] = useState(projeto?.responsavel_id ?? '')
  const [prazo, setPrazo] = useState(projeto?.prazo ?? '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setLoading(true)

    const payload = {
      cliente_id: clienteId,
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      tipo,
      status,
      responsavel_id: responsavelId || null,
      prazo: prazo || null,
    }

    const { error } = projeto
      ? await supabase.from('projetos').update(payload).eq('id', projeto.id)
      : await supabase.from('projetos').insert(payload)

    if (error) {
      toast.error('Erro ao salvar projeto')
    } else {
      toast.success(projeto ? 'Projeto atualizado!' : `Projeto "${payload.nome}" criado!`)
      if (!projeto) { setNome(''); setDescricao(''); setTipo('pontual'); setResponsavelId(''); setPrazo('') }
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="bg-[#0a0a22] border border-[#00ff88]/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-[#00ff88]" />
            {projeto ? 'Editar projeto' : 'Novo projeto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Nome *</label>
            <Input value={nome} onChange={e => setNome(e.target.value)} required placeholder="Ex: Gestão de Tráfego" className="neon-input mt-1 h-9 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as ProjetoTipo)}
                className="neon-input mt-1 h-9 text-sm w-full rounded-md px-3 bg-transparent">
                {TIPO_OPTIONS.map(t => <option key={t} value={t} className="bg-[#0a0a22]">{PROJETO_TIPO_LABELS[t]}</option>)}
              </select>
            </div>
            {projeto ? (
              <div>
                <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as ProjetoStatus)}
                  className="neon-input mt-1 h-9 text-sm w-full rounded-md px-3 bg-transparent">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-[#0a0a22]">{PROJETO_STATUS_LABELS[s]}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Prazo</label>
                <DateRangeModal
                  value={{ from: prazo || null, to: prazo || null }}
                  onChange={r => setPrazo(r.to ?? r.from ?? '')}
                  title="Prazo do projeto"
                  placeholder="Sem prazo"
                  triggerClassName="mt-1 w-full"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Responsável</label>
              <select value={responsavelId} onChange={e => setResponsavelId(e.target.value)}
                className="neon-input mt-1 h-9 text-sm w-full rounded-md px-3 bg-transparent">
                <option value="" className="bg-[#0a0a22]">Sem responsável</option>
                {perfis.map(p => <option key={p.id} value={p.id} className="bg-[#0a0a22]">{p.name}</option>)}
              </select>
            </div>
            {projeto && (
              <div>
                <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Prazo</label>
                <DateRangeModal
                  value={{ from: prazo || null, to: prazo || null }}
                  onChange={r => setPrazo(r.to ?? r.from ?? '')}
                  title="Prazo do projeto"
                  placeholder="Sem prazo"
                  triggerClassName="mt-1 w-full"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Descrição</label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Escopo, briefing, links..." className="neon-input mt-1 text-sm min-h-16" />
          </div>

          <motion.button
            type="submit"
            disabled={loading || !nome.trim()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/20 transition-all disabled:opacity-40 w-full justify-center"
          >
            <FolderKanban className="h-4 w-4" />
            {loading ? 'Salvando...' : projeto ? 'Salvar alterações' : 'Criar projeto'}
          </motion.button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
