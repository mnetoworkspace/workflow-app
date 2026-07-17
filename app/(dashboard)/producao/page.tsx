import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Cliente, Entrega, Profile } from '@/types'
import ProducaoBoard from '@/components/producao/ProducaoBoard'
import FiltrosProducao from '@/components/producao/FiltrosProducao'
import { FolderKanban } from 'lucide-react'

export default async function ProducaoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; resp?: string }>
}) {
  const { cliente: filtroCliente, resp: filtroResp } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: entregas }, { data: clientes }, { data: perfis }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase
      .from('entregas')
      .select('*, responsavel:profiles(*), projeto:projetos(*, cliente:clientes(*))')
      .neq('status', 'cancelada')
      .order('created_at', { ascending: false }),
    supabase.from('clientes').select('*').eq('status', 'ativo').order('nome'),
    supabase.from('profiles').select('*').order('name'),
  ])

  const isAdmin = profile?.role === 'admin'
  let lista = (entregas ?? []) as Entrega[]
  if (filtroCliente) lista = lista.filter(e => e.projeto?.cliente_id === filtroCliente)
  if (filtroResp) lista = lista.filter(e => e.responsavel_id === filtroResp)

  const pendentes = lista.filter(e => e.status !== 'entregue').length

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-[#00ff88]" style={{ filter: 'drop-shadow(0 0 8px #00ff88)' }} />
            Produção
          </h1>
          <p className="text-[#6666aa] text-sm mt-1">
            {pendentes} entrega{pendentes === 1 ? '' : 's'} em aberto
          </p>
        </div>
        <FiltrosProducao clientes={(clientes ?? []) as Cliente[]} perfis={(perfis ?? []) as Profile[]} />
      </div>

      {lista.length === 0 ? (
        <div className="neon-card rounded-2xl border border-white/[0.06] p-10 text-center">
          <FolderKanban className="h-8 w-8 text-[#6666aa] mx-auto mb-3" />
          <p className="text-sm text-[#8888aa]">Nenhuma entrega encontrada.</p>
          <p className="text-xs text-[#6666aa] mt-1">Crie entregas nos projetos de cada cliente, na aba Clientes.</p>
        </div>
      ) : (
        <ProducaoBoard
          entregas={lista}
          perfis={(perfis ?? []) as Profile[]}
          userId={user.id}
          isAdmin={isAdmin}
          showCliente
        />
      )}
    </div>
  )
}
