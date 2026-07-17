'use client'

import { createClient } from '@/lib/supabase/client'
import {
  Entrega, EntregaStatus, Profile,
  ENTREGA_STATUS_LABELS, ENTREGA_STATUS_COLORS,
  PRIORIDADE_LABELS, PRIORIDADE_COLORS, KANBAN_COLUNAS,
} from '@/types'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import EntregaForm from './EntregaForm'
import { MoreVertical, Pencil, CalendarDays, ArrowRight, CheckCircle2, XCircle, Trash2, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { format, isBefore, startOfDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function EntregaCard({
  entrega,
  perfis,
  userId,
  isAdmin,
  showCliente = false,
}: {
  entrega: Entrega
  perfis: Profile[]
  userId: string
  isAdmin: boolean
  showCliente?: boolean
}) {
  const router = useRouter()
  const supabase = createClient()
  const prioridadeColor = PRIORIDADE_COLORS[entrega.prioridade]

  const atrasada = entrega.prazo
    && entrega.status !== 'entregue'
    && entrega.status !== 'cancelada'
    && isBefore(parseISO(entrega.prazo), startOfDay(new Date()))

  async function handleMove(status: EntregaStatus) {
    if (status === 'entregue') {
      const res = await fetch('/api/entregas/concluir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entregaId: entrega.id }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Erro ao concluir entrega'); return }
      toast.success(data.mensagem || 'Entrega concluída! 🎉')
    } else {
      const { error } = await supabase.from('entregas').update({ status }).eq('id', entrega.id)
      if (error) { toast.error('Erro ao mover entrega'); return }
      toast.success(`Movida para ${ENTREGA_STATUS_LABELS[status]}`)
    }
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`Excluir a entrega "${entrega.titulo}"?`)) return
    const { error } = await supabase.from('entregas').delete().eq('id', entrega.id)
    if (error) toast.error('Erro ao excluir')
    else { toast.success('Entrega excluída'); router.refresh() }
  }

  const responsavel = entrega.responsavel
  const initials = responsavel?.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const clienteNome = entrega.projeto?.cliente?.nome

  return (
    <div
      className="rounded-xl border bg-white/[0.02] p-3 space-y-2 group"
      style={{ borderColor: `${prioridadeColor}25` }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] text-white font-medium leading-snug flex-1">{entrega.titulo}</p>
        <div className="flex items-center shrink-0 -mr-1 -mt-1">
          <EntregaForm
            projetoId={entrega.projeto_id}
            entrega={entrega}
            perfis={perfis}
            userId={userId}
            trigger={
              <button className="p-1 rounded text-[#444466] hover:text-[#00f0ff] transition-colors">
                <Pencil className="h-3 w-3" />
              </button>
            }
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="p-1 rounded text-[#444466] hover:text-white transition-colors">
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              }
            />
            <DropdownMenuContent className="bg-[#0a0a22] border border-white/10 text-[#aaaacc]">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-[#6666aa]">Mover para</DropdownMenuLabel>
              {KANBAN_COLUNAS.filter(s => s !== entrega.status).map(s => (
                <DropdownMenuItem key={s} onClick={() => handleMove(s)} className="text-xs gap-2">
                  {s === 'entregue'
                    ? <CheckCircle2 className="h-3.5 w-3.5" style={{ color: ENTREGA_STATUS_COLORS[s] }} />
                    : <ArrowRight className="h-3.5 w-3.5" style={{ color: ENTREGA_STATUS_COLORS[s] }} />}
                  {ENTREGA_STATUS_LABELS[s]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              {entrega.status !== 'cancelada' && (
                <DropdownMenuItem onClick={() => handleMove('cancelada')} className="text-xs gap-2 text-[#ff8800]">
                  <XCircle className="h-3.5 w-3.5" /> Cancelar entrega
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <DropdownMenuItem onClick={handleDelete} className="text-xs gap-2 text-[#ff0055]">
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showCliente && clienteNome && (
        <p className="text-[10px] text-[#ff0080] flex items-center gap-1">
          <Building2 className="h-3 w-3" /> {clienteNome}
          {entrega.projeto?.nome && <span className="text-[#6666aa]"> · {entrega.projeto.nome}</span>}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0"
            style={{ color: prioridadeColor, borderColor: `${prioridadeColor}40`, background: `${prioridadeColor}10` }}
          >
            {PRIORIDADE_LABELS[entrega.prioridade]}
          </span>
          {entrega.prazo && (
            <span className={`text-[10px] inline-flex items-center gap-1 ${atrasada ? 'text-[#ff0055] font-semibold' : 'text-[#6666aa]'}`}>
              <CalendarDays className="h-3 w-3" />
              {format(parseISO(entrega.prazo), 'dd MMM', { locale: ptBR })}
              {atrasada && ' · atrasada'}
            </span>
          )}
        </div>

        {responsavel && (
          <Avatar className="h-5 w-5 rounded-full shrink-0" title={responsavel.name}>
            {responsavel.avatar_url && <AvatarImage src={responsavel.avatar_url} alt={responsavel.name} />}
            <AvatarFallback className="bg-[#0f0f28] text-[#00f0ff] text-[8px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  )
}
