'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Cliente, ClienteStatus, CLIENTE_STATUS_LABELS } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const STATUS_OPTIONS: ClienteStatus[] = ['ativo', 'pausado', 'encerrado']

export default function ClienteForm({ cliente, trigger }: { cliente?: Cliente; trigger: React.ReactElement }) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState(cliente?.nome ?? '')
  const [segmento, setSegmento] = useState(cliente?.segmento ?? '')
  const [site, setSite] = useState(cliente?.site ?? '')
  const [instagram, setInstagram] = useState(cliente?.instagram ?? '')
  const [status, setStatus] = useState<ClienteStatus>(cliente?.status ?? 'ativo')
  const [observacoes, setObservacoes] = useState(cliente?.observacoes ?? '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setLoading(true)

    const payload = {
      nome: nome.trim(),
      segmento: segmento.trim() || null,
      site: site.trim() || null,
      instagram: instagram.trim().replace(/^@/, '') || null,
      status,
      observacoes: observacoes.trim() || null,
    }

    const { error } = cliente
      ? await supabase.from('clientes').update(payload).eq('id', cliente.id)
      : await supabase.from('clientes').insert(payload)

    if (error) {
      toast.error(cliente ? 'Erro ao atualizar cliente' : 'Erro ao criar cliente')
    } else {
      toast.success(cliente ? 'Cliente atualizado!' : `${payload.nome} adicionado!`)
      if (!cliente) {
        setNome(''); setSegmento(''); setSite(''); setInstagram(''); setStatus('ativo'); setObservacoes('')
      }
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="bg-[#0a0a22] border border-[#ff0080]/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#ff0080]" />
            {cliente ? 'Editar cliente' : 'Novo cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Nome *</label>
            <Input value={nome} onChange={e => setNome(e.target.value)} required placeholder="Ex: Monã Eventos" className="neon-input mt-1 h-9 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Segmento</label>
              <Input value={segmento} onChange={e => setSegmento(e.target.value)} placeholder="Ex: Eventos" className="neon-input mt-1 h-9 text-sm" />
            </div>
            <div>
              <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ClienteStatus)}
                className="neon-input mt-1 h-9 text-sm w-full rounded-md px-3 bg-transparent"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s} className="bg-[#0a0a22]">{CLIENTE_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Site</label>
              <Input value={site} onChange={e => setSite(e.target.value)} placeholder="https://..." className="neon-input mt-1 h-9 text-sm" />
            </div>
            <div>
              <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Instagram</label>
              <Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@perfil" className="neon-input mt-1 h-9 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Observações</label>
            <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Anotações internas sobre o cliente..." className="neon-input mt-1 text-sm min-h-20" />
          </div>

          <motion.button
            type="submit"
            disabled={loading || !nome.trim()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[#ff0080]/10 border border-[#ff0080]/30 text-[#ff0080] hover:bg-[#ff0080]/20 transition-all disabled:opacity-40 w-full justify-center"
            style={{ boxShadow: '0 0 12px rgba(255,0,128,0.1)' }}
          >
            <Building2 className="h-4 w-4" />
            {loading ? 'Salvando...' : cliente ? 'Salvar alterações' : 'Criar cliente'}
          </motion.button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
