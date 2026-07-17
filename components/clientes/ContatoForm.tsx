'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClienteContato } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function ContatoForm({
  clienteId,
  contato,
  trigger,
}: {
  clienteId: string
  contato?: ClienteContato
  trigger: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState(contato?.nome ?? '')
  const [cargo, setCargo] = useState(contato?.cargo ?? '')
  const [telefone, setTelefone] = useState(contato?.telefone ?? '')
  const [email, setEmail] = useState(contato?.email ?? '')
  const [principal, setPrincipal] = useState(contato?.principal ?? false)
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
      cargo: cargo.trim() || null,
      telefone: telefone.trim() || null,
      email: email.trim() || null,
      principal,
    }

    const { error } = contato
      ? await supabase.from('cliente_contatos').update(payload).eq('id', contato.id)
      : await supabase.from('cliente_contatos').insert(payload)

    if (error) {
      toast.error('Erro ao salvar contato')
    } else {
      toast.success(contato ? 'Contato atualizado!' : 'Contato adicionado!')
      if (!contato) { setNome(''); setCargo(''); setTelefone(''); setEmail(''); setPrincipal(false) }
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="bg-[#0a0a22] border border-[#00f0ff]/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#00f0ff]" />
            {contato ? 'Editar contato' : 'Novo contato'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Nome *</label>
              <Input value={nome} onChange={e => setNome(e.target.value)} required placeholder="Ex: João Silva" className="neon-input mt-1 h-9 text-sm" />
            </div>
            <div>
              <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Cargo</label>
              <Input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Ex: Sócio" className="neon-input mt-1 h-9 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Telefone</label>
              <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(84) 9...." className="neon-input mt-1 h-9 text-sm" />
            </div>
            <div>
              <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Email</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@..." className="neon-input mt-1 h-9 text-sm" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-[#8888aa] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={principal}
              onChange={e => setPrincipal(e.target.checked)}
              className="accent-[#00f0ff] h-3.5 w-3.5"
            />
            Contato principal
          </label>

          <motion.button
            type="submit"
            disabled={loading || !nome.trim()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all disabled:opacity-40 w-full justify-center"
          >
            <UserPlus className="h-4 w-4" />
            {loading ? 'Salvando...' : contato ? 'Salvar alterações' : 'Adicionar contato'}
          </motion.button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
