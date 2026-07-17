import Link from 'next/link'
import { Cliente, CLIENTE_STATUS_LABELS, CLIENTE_STATUS_COLORS } from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ClienteForm from './ClienteForm'
import { ArrowLeft, Globe, AtSign, Pencil } from 'lucide-react'

export default function ClienteHeader({ cliente, isAdmin }: { cliente: Cliente; isAdmin: boolean }) {
  const initials = cliente.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const statusColor = CLIENTE_STATUS_COLORS[cliente.status]

  return (
    <div className="mb-6">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1.5 text-[11px] text-[#6666aa] hover:text-[#ff0080] transition-colors mb-4"
      >
        <ArrowLeft className="h-3 w-3" /> Clientes
      </Link>

      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 rounded-2xl shrink-0">
          {cliente.logo_url && <AvatarImage src={cliente.logo_url} alt={cliente.nome} />}
          <AvatarFallback className="rounded-2xl bg-[#0f0f28] text-[#ff0080] text-lg font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white truncate">{cliente.nome}</h1>
            <span
              className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border"
              style={{ color: statusColor, borderColor: `${statusColor}40`, background: `${statusColor}10` }}
            >
              {CLIENTE_STATUS_LABELS[cliente.status]}
            </span>
          </div>
          <p className="text-sm text-[#6666aa] mt-0.5">{cliente.segmento || 'Sem segmento'}</p>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {cliente.site && (
              <a href={cliente.site.startsWith('http') ? cliente.site : `https://${cliente.site}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[#00f0ff] hover:underline">
                <Globe className="h-3 w-3" /> Site
              </a>
            )}
            {cliente.instagram && (
              <a href={`https://instagram.com/${cliente.instagram}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[#b44bff] hover:underline">
                <AtSign className="h-3 w-3" /> {cliente.instagram}
              </a>
            )}
          </div>
        </div>

        {isAdmin && (
          <ClienteForm
            cliente={cliente}
            trigger={
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium bg-white/[0.03] border border-white/[0.08] text-[#8888aa] hover:text-white hover:border-[#ff0080]/30 transition-all shrink-0">
                <Pencil className="h-3 w-3" /> Editar
              </button>
            }
          />
        )}
      </div>
    </div>
  )
}
