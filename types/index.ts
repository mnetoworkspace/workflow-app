export type TaskStatus = 'em_andamento' | 'concluida' | 'cancelada' | 'postergada'

export type TaskComplexidade = 'leve' | 'media' | 'pesada'

export type UserRole = 'admin' | 'collaborator'

export type BadgeTipo = string

export interface BadgeType {
  id: string
  tipo: string
  label: string
  emoji: string
  descricao: string
  is_custom: boolean
  created_at: string
}

export type AvatarFrame = 'none' | 'cyan' | 'purple' | 'green' | 'pink' | 'gold' | 'rainbow'

export interface ProfileSticker {
  position: number
  emoji: string
}

export interface Profile {
  id: string
  name: string
  email: string
  avatar_url: string | null
  cargo: string | null
  role: UserRole
  pontos: number
  streak: number
  recorde_streak: number
  bio: string | null
  avatar_frame: AvatarFrame
  stickers: ProfileSticker[]
  banner_url: string | null
  daily_mood: string | null
  ordem_daily: number | null
  created_at: string
}

export const FRAME_LABELS: Record<AvatarFrame, string> = {
  none: 'Padrão',
  cyan: 'Neon Cyan',
  purple: 'Neon Roxo',
  green: 'Neon Verde',
  pink: 'Neon Pink',
  gold: 'Neon Gold',
  rainbow: 'Rainbow',
}

export const AVAILABLE_STICKERS = [
  '🤖','🚀','⚡','🔥','💎','👾','💻','🎮',
  '⚙️','🌐','🔮','🦾','💀','🎯','🏆','🌟',
  '💥','🎲','🧬','🛸','🧿','⚔️','🔬','🌀',
]

export interface Task {
  id: string
  user_id: string
  titulo: string
  data: string
  status: TaskStatus
  complexidade: TaskComplexidade
  origem_task_id: string | null
  concluida_em: string | null
  cliente_id: string | null
  entrega_id: string | null
  created_at: string
  profile?: Profile
  cliente?: Cliente
  entrega?: Entrega
}

// ============================================
// Clientes & Produção
// ============================================

export type ClienteStatus = 'ativo' | 'pausado' | 'encerrado'

export interface Cliente {
  id: string
  nome: string
  logo_url: string | null
  status: ClienteStatus
  segmento: string | null
  site: string | null
  instagram: string | null
  observacoes: string | null
  origem: string
  created_at: string
}

export interface ClienteContato {
  id: string
  cliente_id: string
  nome: string
  cargo: string | null
  telefone: string | null
  email: string | null
  principal: boolean
  created_at: string
}

export type ProjetoTipo = 'recorrente' | 'pontual'
export type ProjetoStatus = 'ativo' | 'pausado' | 'concluido' | 'cancelado'

export interface Projeto {
  id: string
  cliente_id: string
  nome: string
  descricao: string | null
  tipo: ProjetoTipo
  status: ProjetoStatus
  responsavel_id: string | null
  prazo: string | null
  created_at: string
  cliente?: Cliente
  responsavel?: Profile
  entregas?: Entrega[]
}

export type EntregaStatus = 'backlog' | 'em_producao' | 'revisao' | 'entregue' | 'cancelada'
export type EntregaPrioridade = 'baixa' | 'media' | 'alta' | 'urgente'

export interface Entrega {
  id: string
  projeto_id: string
  titulo: string
  descricao: string | null
  status: EntregaStatus
  prioridade: EntregaPrioridade
  responsavel_id: string | null
  prazo: string | null
  ordem: number
  entregue_em: string | null
  created_by: string | null
  created_at: string
  projeto?: Projeto
  responsavel?: Profile
}

export const CLIENTE_STATUS_LABELS: Record<ClienteStatus, string> = {
  ativo: 'Ativo',
  pausado: 'Pausado',
  encerrado: 'Encerrado',
}

export const CLIENTE_STATUS_COLORS: Record<ClienteStatus, string> = {
  ativo: '#00ff88',
  pausado: '#ff8800',
  encerrado: '#6666aa',
}

export const PROJETO_TIPO_LABELS: Record<ProjetoTipo, string> = {
  recorrente: 'Recorrente',
  pontual: 'Pontual',
}

export const PROJETO_STATUS_LABELS: Record<ProjetoStatus, string> = {
  ativo: 'Ativo',
  pausado: 'Pausado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export const ENTREGA_STATUS_LABELS: Record<EntregaStatus, string> = {
  backlog: 'Backlog',
  em_producao: 'Em Produção',
  revisao: 'Revisão',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
}

export const ENTREGA_STATUS_COLORS: Record<EntregaStatus, string> = {
  backlog: '#6666aa',
  em_producao: '#00f0ff',
  revisao: '#b44bff',
  entregue: '#00ff88',
  cancelada: '#ff0055',
}

// Colunas do kanban (cancelada fica fora do board, acessível via filtro)
export const KANBAN_COLUNAS: EntregaStatus[] = ['backlog', 'em_producao', 'revisao', 'entregue']

export const PRIORIDADE_LABELS: Record<EntregaPrioridade, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
}

export const PRIORIDADE_COLORS: Record<EntregaPrioridade, string> = {
  baixa: '#6666aa',
  media: '#00f0ff',
  alta: '#ff8800',
  urgente: '#ff0055',
}

export const PRIORIDADE_ORDEM: Record<EntregaPrioridade, number> = {
  urgente: 0,
  alta: 1,
  media: 2,
  baixa: 3,
}

export interface Impedimento {
  id: string
  user_id: string
  data: string
  descricao: string | null
  created_at: string
  profile?: Profile
}

export interface Badge {
  id: string
  user_id: string
  tipo: BadgeTipo
  desbloqueado_em: string
}

export interface PontosHistorico {
  id: string
  user_id: string
  pontos: number
  motivo: string
  created_at: string
}

export interface Falta {
  id: string
  user_id: string
  data: string
  created_by: string | null
  created_at: string
}

export interface DailyConfig {
  id: string
  dia_semana: number
  horario: string
  ativo: boolean
}

export interface DailyMembro {
  profile: Profile
  tarefasAnteriores: Task[]
  tarefasAtuais: Task[]
  impedimento: Impedimento | null
}

export const NIVEL_LABELS: Record<string, string> = {
  'Estagiário de Elite': 'Estagiário de Elite',
  'Colaborador Raiz': 'Colaborador Raiz',
  'Sênior de Verdade': 'Sênior de Verdade',
  'Ninja do Squad': 'Ninja do Squad',
  'Lenda Vivente': 'Lenda Vivente',
}

export function getNivel(pontos: number): string {
  if (pontos >= 1000) return 'Lenda Vivente'
  if (pontos >= 600) return 'Ninja do Squad'
  if (pontos >= 300) return 'Sênior de Verdade'
  if (pontos >= 100) return 'Colaborador Raiz'
  return 'Estagiário de Elite'
}

export function getProximoNivel(pontos: number): { nome: string; pontosNecessarios: number } | null {
  if (pontos >= 1000) return null
  if (pontos >= 600) return { nome: 'Lenda Vivente', pontosNecessarios: 1000 }
  if (pontos >= 300) return { nome: 'Ninja do Squad', pontosNecessarios: 600 }
  if (pontos >= 100) return { nome: 'Sênior de Verdade', pontosNecessarios: 300 }
  return { nome: 'Colaborador Raiz', pontosNecessarios: 100 }
}

export const BADGE_INFO: Record<string, { label: string; descricao: string; emoji: string }> = {
  sem_frescura:    { label: 'Sem Frescura',     descricao: '7 dias sem impedimentos',                        emoji: '🧊' },
  nao_tem_amanha:  { label: 'Não Tem Amanhã',   descricao: 'Semana inteira sem postergar',                   emoji: '⚡' },
  madrugador:      { label: 'Madrugador',        descricao: 'Registrou tarefas antes das 8h por 5 dias',     emoji: '🌅' },
  inabalavel:      { label: 'Inabalável',        descricao: 'Streak de 30 dias',                             emoji: '🏔️' },
  consistente:     { label: 'Consistente',       descricao: 'Participou de 50 dailies',                      emoji: '📅' },
  limpinho:        { label: 'Limpinho',          descricao: '100 tarefas concluídas',                        emoji: '✨' },
  velocista:       { label: 'Velocista',         descricao: 'Concluiu todas as tarefas do dia antes das 12h', emoji: '🚀' },
  sempre_presente: { label: 'Sempre Presente',   descricao: '30 dias seguidos sem faltar à daily',           emoji: '🎯' },
  semana_perfeita: { label: 'Semana Perfeita',   descricao: 'Presente todos os dias da semana',              emoji: '⭐' },
  fantasma:        { label: 'Fantasma',          descricao: 'Faltou 5 vezes no mês',                         emoji: '👻' },
  entregador:      { label: 'Entregador',        descricao: '10 entregas concluídas',                        emoji: '📦' },
  no_prazo:        { label: 'No Prazo',          descricao: '10 entregas concluídas dentro do prazo',        emoji: '⏱️' },
}

export const PONTOS = {
  TAREFA_CONCLUIDA: 10,
  BONUS_TODAS_CONCLUIDAS: 25,
  IMPEDIMENTO_DESCRITO: 5,
  ZERO_POSTERGADAS: 15,
  PARTICIPOU_DAILY: 5,
  ENTREGA_CONCLUIDA: 20,
  BONUS_ENTREGA_NO_PRAZO: 10,
}

// Pontos por complexidade da task (missão mais pesada vale mais)
export const PONTOS_COMPLEXIDADE: Record<TaskComplexidade, number> = {
  leve: 5,
  media: 10,
  pesada: 20,
}

export const COMPLEXIDADE_LABELS: Record<TaskComplexidade, string> = {
  leve: 'Leve',
  media: 'Média',
  pesada: 'Pesada',
}

export const COMPLEXIDADE_COLORS: Record<TaskComplexidade, string> = {
  leve: '#00f0ff',
  media: '#b44bff',
  pesada: '#ff8800',
}

export function getPontosTask(task: Pick<Task, 'complexidade'>): number {
  return PONTOS_COMPLEXIDADE[task.complexidade ?? 'media'] ?? PONTOS.TAREFA_CONCLUIDA
}
