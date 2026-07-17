import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Cliente, ClienteStatus, CLIENTE_STATUS_LABELS } from '@/types'
import ClienteCard from '@/components/clientes/ClienteCard'
import ClienteForm from '@/components/clientes/ClienteForm'
import { Plus, Building2 } from 'lucide-react'

export default async function ClientesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: clientes }, { data: projetosAtivos }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('clientes').select('*').order('nome'),
    supabase.from('projetos').select('id, cliente_id').eq('status', 'ativo'),
  ])

  const isAdmin = profile?.role === 'admin'
  const lista = (clientes ?? []) as Cliente[]

  const projetosPorCliente = new Map<string, number>()
  for (const p of projetosAtivos ?? []) {
    projetosPorCliente.set(p.cliente_id, (projetosPorCliente.get(p.cliente_id) ?? 0) + 1)
  }

  const grupos: ClienteStatus[] = ['ativo', 'pausado', 'encerrado']

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#ff0080]" style={{ filter: 'drop-shadow(0 0 8px #ff0080)' }} />
            Clientes
          </h1>
          <p className="text-[#6666aa] text-sm mt-1">
            {lista.filter(c => c.status === 'ativo').length} ativo{lista.filter(c => c.status === 'ativo').length === 1 ? '' : 's'} · {lista.length} no total
          </p>
        </div>

        {isAdmin && (
          <ClienteForm
            trigger={
              <button className="flex items-center gap-1.5 px-4 h-10 rounded-lg text-sm font-medium bg-[#ff0080]/10 text-[#ff0080] border border-[#ff0080]/30 hover:bg-[#ff0080]/20 transition-colors"
                style={{ boxShadow: '0 0 12px rgba(255,0,128,0.15)' }}>
                <Plus className="h-3.5 w-3.5" /> Novo Cliente
              </button>
            }
          />
        )}
      </div>

      {lista.length === 0 ? (
        <div className="neon-card rounded-2xl border border-white/[0.06] p-10 text-center">
          <Building2 className="h-8 w-8 text-[#6666aa] mx-auto mb-3" />
          <p className="text-sm text-[#8888aa]">Nenhum cliente cadastrado ainda.</p>
          {isAdmin && <p className="text-xs text-[#6666aa] mt-1">Clique em &quot;Novo Cliente&quot; para começar.</p>}
        </div>
      ) : (
        <div className="space-y-8">
          {grupos.map(status => {
            const doGrupo = lista.filter(c => c.status === status)
            if (doGrupo.length === 0) return null
            return (
              <section key={status}>
                <p className="text-[10px] font-semibold text-[#6666aa] uppercase tracking-wider mb-3">
                  {CLIENTE_STATUS_LABELS[status]}s ({doGrupo.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {doGrupo.map(cliente => (
                    <ClienteCard
                      key={cliente.id}
                      cliente={cliente}
                      projetosAtivos={projetosPorCliente.get(cliente.id) ?? 0}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
