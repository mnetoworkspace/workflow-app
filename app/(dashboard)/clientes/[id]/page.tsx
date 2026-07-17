import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Cliente, ClienteContato, Projeto, Entrega } from '@/types'
import ClienteHeader from '@/components/clientes/ClienteHeader'
import ContatosList from '@/components/clientes/ContatosList'
import ClienteVisaoGeral from '@/components/clientes/ClienteVisaoGeral'
import ClienteAtividades from '@/components/clientes/ClienteAtividades'
import ProjetosCliente from '@/components/producao/ProjetosCliente'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default async function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: cliente }, { data: contatos }, { data: projetos }, { data: perfis }, { data: tasksCliente }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('clientes').select('*').eq('id', id).maybeSingle(),
    supabase.from('cliente_contatos').select('*').eq('cliente_id', id).order('principal', { ascending: false }).order('nome'),
    supabase.from('projetos').select('*, responsavel:profiles(*), entregas(*, responsavel:profiles(*))').eq('cliente_id', id).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').order('name'),
    supabase.from('tasks').select('*, profile:profiles(*)').eq('cliente_id', id).order('data', { ascending: false }).order('created_at', { ascending: true }).limit(300),
  ])

  if (!cliente) notFound()

  const todasTasks = tasksCliente ?? []
  const tasksRecentes = todasTasks.slice(0, 8)

  const isAdmin = profile?.role === 'admin'
  const listaContatos = (contatos ?? []) as ClienteContato[]
  const listaProjetos = (projetos ?? []) as Projeto[]
  const todasEntregas = listaProjetos.flatMap(p => (p.entregas ?? []) as Entrega[])

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <ClienteHeader cliente={cliente as Cliente} isAdmin={isAdmin} />

      <Tabs defaultValue="visao">
        <TabsList className="mb-4">
          <TabsTrigger value="visao">Visão Geral</TabsTrigger>
          <TabsTrigger value="atividades">Atividades</TabsTrigger>
          <TabsTrigger value="producao">Produção</TabsTrigger>
          <TabsTrigger value="contatos">Contatos</TabsTrigger>
        </TabsList>

        <TabsContent value="visao">
          <ClienteVisaoGeral
            cliente={cliente as Cliente}
            contatos={listaContatos}
            projetos={listaProjetos}
            entregas={todasEntregas}
            tasksRecentes={tasksRecentes}
          />
        </TabsContent>

        <TabsContent value="atividades">
          <ClienteAtividades tasks={todasTasks} />
        </TabsContent>

        <TabsContent value="producao">
          <ProjetosCliente
            cliente={cliente as Cliente}
            projetos={listaProjetos}
            perfis={perfis ?? []}
            userId={user.id}
          />
        </TabsContent>

        <TabsContent value="contatos">
          <ContatosList clienteId={id} contatos={listaContatos} isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
