'use client'

import { createClient } from '@/lib/supabase/client'
import { ClienteContato } from '@/types'
import ContatoForm from './ContatoForm'
import { Phone, Mail, Star, Pencil, Trash2, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function ContatosList({
  clienteId,
  contatos,
  isAdmin,
}: {
  clienteId: string
  contatos: ClienteContato[]
  isAdmin: boolean
}) {
  const router = useRouter()
  const supabase = createClient()

  async function handleDelete(contato: ClienteContato) {
    if (!confirm(`Remover o contato ${contato.nome}?`)) return
    const { error } = await supabase.from('cliente_contatos').delete().eq('id', contato.id)
    if (error) toast.error('Erro ao remover contato')
    else { toast.success('Contato removido'); router.refresh() }
  }

  return (
    <div className="neon-card rounded-2xl border border-white/[0.06] overflow-hidden">
      <div className="h-px bg-gradient-to-r from-transparent via-[#00f0ff]/40 to-transparent" />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-semibold text-[#00f0ff] uppercase tracking-wider flex items-center gap-2">
            <Users className="h-3.5 w-3.5" /> Contatos
          </p>
          {isAdmin && (
            <ContatoForm
              clienteId={clienteId}
              trigger={
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-all">
                  <UserPlus className="h-3 w-3" /> Adicionar
                </button>
              }
            />
          )}
        </div>

        {contatos.length === 0 ? (
          <p className="text-xs text-[#6666aa] py-4 text-center">Nenhum contato cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {contatos.map(contato => (
              <div
                key={contato.id}
                className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate flex items-center gap-1.5">
                    {contato.nome}
                    {contato.principal && <Star className="h-3 w-3 text-[#ff8800] fill-[#ff8800]" />}
                  </p>
                  <p className="text-[11px] text-[#6666aa] truncate">{contato.cargo || '—'}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    {contato.telefone && (
                      <a href={`https://wa.me/55${contato.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-[#00ff88] hover:underline inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {contato.telefone}
                      </a>
                    )}
                    {contato.email && (
                      <a href={`mailto:${contato.email}`} className="text-[11px] text-[#00f0ff] hover:underline inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {contato.email}
                      </a>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <ContatoForm
                      clienteId={clienteId}
                      contato={contato}
                      trigger={
                        <button className="p-1.5 rounded-lg text-[#6666aa] hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 transition-all">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      }
                    />
                    <button
                      onClick={() => handleDelete(contato)}
                      className="p-1.5 rounded-lg text-[#6666aa] hover:text-[#ff0055] hover:bg-[#ff0055]/10 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
