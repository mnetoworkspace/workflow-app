export type TaskStatus = 'em_andamento' | 'concluida' | 'cancelada' | 'postergada'

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
  origem_task_id: string | null
  concluida_em: string | null
  created_at: string
  profile?: Profile
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
}

export const PONTOS = {
  TAREFA_CONCLUIDA: 10,
  BONUS_TODAS_CONCLUIDAS: 25,
  IMPEDIMENTO_DESCRITO: 5,
  ZERO_POSTERGADAS: 15,
  PARTICIPOU_DAILY: 5,
}
