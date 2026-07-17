import Link from 'next/link'
import { Cliente, CLIENTE_STATUS_LABELS, CLIENTE_STATUS_COLORS } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FolderKanban } from 'lucide-react'

export default function ClienteCard({ cliente, projetosAtivos }: { cliente: Cliente; projetosAtivos: number }) {
  const initials = cliente.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const statusColor = CLIENTE_STATUS_COLORS[cliente.status]

  return (
    <Link
      href={`/clientes/${cliente.id}`}
      className="neon-card rounded-2xl border border-white/[0.06] p-4 flex items-center gap-4 hover:border-[#ff0080]/25 transition-all group"
    >
      <Avatar className="h-12 w-12 rounded-xl shrink-0">
        {cliente.logo_url && <AvatarImage src={cliente.logo_url} alt={cliente.nome} />}
        <AvatarFallback className="rounded-xl bg-[#0f0f28] text-[#ff0080] text-sm font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate group-hover:text-[#ff0080] transition-colors">
          {cliente.nome}
        </p>
        <p className="text-[11px] text-[#6666aa] truncate">
          {cliente.segmento || 'Sem segmento'}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border"
            style={{ color: statusColor, borderColor: `${statusColor}40`, background: `${statusColor}10` }}
          >
            {CLIENTE_STATUS_LABELS[cliente.status]}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-[#6666aa]">
            <FolderKanban className="h-3 w-3" />
            {projetosAtivos} projeto{projetosAtivos === 1 ? '' : 's'} ativo{projetosAtivos === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </Link>
  )
}
