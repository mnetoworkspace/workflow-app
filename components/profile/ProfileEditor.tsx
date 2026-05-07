'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Profile, Badge, PontosHistorico, BadgeTipo,
  getNivel, getProximoNivel,
  BADGE_INFO, FRAME_LABELS, AVAILABLE_STICKERS, AvatarFrame, ProfileSticker,
} from '@/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Camera, Flame, Star, Trophy, Pencil, Check, X, Image, Link, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const FRAME_OPTIONS: AvatarFrame[] = ['none', 'cyan', 'purple', 'green', 'pink', 'gold', 'rainbow']
const FRAME_COLORS: Record<AvatarFrame, string> = {
  none: '#333355', cyan: '#00f0ff', purple: '#b44bff',
  green: '#00ff88', pink: '#ff0080', gold: '#ffe600', rainbow: '#00f0ff',
}

async function patchProfile(body: Record<string, unknown>) {
  return fetch('/api/profile/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export default function ProfileEditor({
  profile, badges, historico,
}: {
  profile: Profile
  badges: Badge[]
  historico: PontosHistorico[]
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName]           = useState(profile.name)
  const [cargo, setCargo]         = useState(profile.cargo ?? '')
  const [bio, setBio]             = useState(profile.bio ?? '')
  const [frame, setFrame]         = useState<AvatarFrame>(profile.avatar_frame ?? 'none')
  const [stickers, setStickers]   = useState<ProfileSticker[]>(
    Array.isArray(profile.stickers) ? profile.stickers : []
  )
  const [avatarUrl, setAvatarUrl]   = useState(profile.avatar_url)
  const [bannerUrl, setBannerUrl]   = useState(profile.banner_url ?? '')
  const [bannerInput, setBannerInput] = useState(profile.banner_url ?? '')
  const [editingBanner, setEditingBanner] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [editing, setEditing]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [pickerSlot, setPickerSlot] = useState<number | null>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const nivel    = getNivel(profile.pontos)
  const proximo  = getProximoNivel(profile.pontos)
  const nivelBase: Record<string, number> = {
    'Estagiário de Elite': 0, 'Colaborador Raiz': 100,
    'Sênior de Verdade': 300, 'Ninja do Squad': 600, 'Lenda Vivente': 1000,
  }
  const pBase     = nivelBase[nivel] ?? 0
  const progresso = proximo ? Math.min(((profile.pontos - pBase) / (proximo.pontosNecessarios - pBase)) * 100, 100) : 100
  const unlockedBadges = new Set(badges.map(b => b.tipo as BadgeTipo))

  /* ── handlers ── */
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) toast.error(data.error)
    else { setAvatarUrl(data.url); toast.success('Foto atualizada!'); router.refresh() }
    setUploading(false)
    e.target.value = ''
  }

  async function saveInfo() {
    setSaving(true)
    const res = await patchProfile({ name, cargo, bio })
    if (!res.ok) toast.error('Erro ao salvar')
    else { toast.success('Perfil atualizado!'); setEditing(false); router.refresh() }
    setSaving(false)
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/profile/banner', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) toast.error(data.error)
    else { setBannerUrl(data.url); setBannerInput(data.url); toast.success('Banner atualizado!'); router.refresh() }
    setUploadingBanner(false)
    e.target.value = ''
  }

  async function saveBannerUrl() {
    const url = bannerInput.trim() || null
    await patchProfile({ banner_url: url })
    setBannerUrl(bannerInput.trim())
    setEditingBanner(false)
    toast.success(url ? 'Banner atualizado!' : 'Banner removido!')
    router.refresh()
  }

  async function removeBanner() {
    await fetch('/api/profile/banner', { method: 'DELETE' })
    setBannerUrl(''); setBannerInput('')
    setEditingBanner(false)
    toast.success('Banner removido!')
    router.refresh()
  }

  async function saveFrame(f: AvatarFrame) {
    setFrame(f)
    await patchProfile({ avatar_frame: f })
    router.refresh()
    toast.success(`Frame ${FRAME_LABELS[f]} aplicado!`)
  }

  async function placeSticker(emoji: string) {
    if (pickerSlot === null) return
    const updated = stickers.filter(s => s.position !== pickerSlot)
    updated.push({ position: pickerSlot, emoji })
    setStickers(updated)
    setPickerSlot(null)
    await patchProfile({ stickers: updated })
    router.refresh()
  }

  async function removeSticker(pos: number) {
    const updated = stickers.filter(s => s.position !== pos)
    setStickers(updated)
    await patchProfile({ stickers: updated })
    router.refresh()
  }

  /* ── render ── */
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Perfil</h1>
        <p className="text-[#6666aa] text-sm mt-0.5">Personalize sua identidade no squad</p>
      </div>

      {/* ── Avatar + Info card ── */}
      <div className="neon-card rounded-2xl border border-[#00f0ff]/15 overflow-hidden">
        <div className="h-px bg-gradient-to-r from-transparent via-[#00f0ff]/50 to-transparent" />

        <div className="p-6 flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="relative">
              <button
                onClick={() => fileRef.current?.click()}
                className="relative group block rounded-full"
                title="Alterar foto"
              >
                <Avatar className={cn('h-24 w-24 rounded-full', frame !== 'none' && `frame-${frame}`)}>
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={name} className="object-cover" />}
                  <AvatarFallback className="bg-[#0a0a20] text-[#00f0ff] text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploading
                    ? <span className="h-5 w-5 rounded-full border-2 border-[#00f0ff] border-t-transparent animate-spin" />
                    : <Camera className="h-5 w-5 text-white" />}
                </div>
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <p className="text-[10px] text-[#333355]">Clique para alterar</p>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {editing ? (
                <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                  <div>
                    <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Nome</label>
                    <Input value={name} onChange={e => setName(e.target.value)} className="neon-input mt-1 h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Cargo</label>
                    <Input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Ex: Designer" className="neon-input mt-1 h-9 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6666aa] uppercase tracking-wider font-semibold">Bio</label>
                    <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Uma frase sobre você..." className="neon-input mt-1 text-sm resize-none" rows={2} />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={saveInfo} disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] text-xs font-medium hover:bg-[#00ff88]/20 transition-colors disabled:opacity-50">
                      <Check className="h-3.5 w-3.5" />{saving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button onClick={() => { setEditing(false); setName(profile.name); setCargo(profile.cargo ?? ''); setBio(profile.bio ?? '') }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-[#6666aa] text-xs hover:text-white transition-colors">
                      <X className="h-3.5 w-3.5" />Cancelar
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-xl font-bold text-white">{name}</h2>
                      {cargo && <p className="text-sm text-[#6666aa] mt-0.5">{cargo}</p>}
                      {bio && <p className="text-sm text-[#888888] mt-1 italic">"{bio}"</p>}
                    </div>
                    <button onClick={() => setEditing(true)}
                      className="p-1.5 rounded-lg text-[#444466] hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 transition-colors shrink-0">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full border border-[#b44bff]/30 bg-[#b44bff]/10 text-[#b44bff]">{nivel}</span>
                    {profile.role === 'admin' && (
                      <span className="text-xs px-2 py-0.5 rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/10 text-[#00f0ff]">Admin</span>
                    )}
                  </div>

                  {/* Level bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-[#444466] mb-1">
                      <span>{nivel}</span>
                      {proximo && <span>{proximo.pontosNecessarios - profile.pontos} pts → {proximo.nome}</span>}
                    </div>
                    <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg,#b44bff,#00f0ff)' }}
                        initial={{ width: 0 }} animate={{ width: `${progresso}%` }}
                        transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }} />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-5 mt-3">
                    {[
                      { icon: Star,   val: profile.pontos,          color: '#ffe600', label: 'pts' },
                      { icon: Flame,  val: profile.streak,           color: '#ff8800', label: 'streak' },
                      { icon: Trophy, val: profile.recorde_streak,   color: '#b44bff', label: 'recorde' },
                    ].map(({ icon: Icon, val, color, label }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <Icon className="h-3.5 w-3.5" style={{ color }} />
                        <span className="text-sm font-bold font-mono" style={{ color }}>{val}</span>
                        <span className="text-[10px] text-[#444466]">{label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Frame picker ── */}
        <div className="px-6 pb-4 border-t border-white/[0.05] pt-4">
          <p className="text-[10px] font-semibold text-[#6666aa] uppercase tracking-wider mb-3">Frame do avatar</p>
          <div className="flex gap-2 flex-wrap">
            {FRAME_OPTIONS.map(f => {
              const isActive = frame === f
              const color = FRAME_COLORS[f]
              return (
                <button key={f} onClick={() => saveFrame(f)}
                  className={cn(
                    'relative px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    isActive ? 'text-white' : 'text-[#444466] border-white/[0.07] hover:text-white hover:border-white/20'
                  )}
                  style={isActive ? { borderColor: `${color}60`, background: `${color}15`, color, boxShadow: `0 0 12px ${color}30` } : {}}
                >
                  {f === 'rainbow' && (
                    <span className="absolute inset-0 rounded-lg opacity-20"
                      style={{ background: 'linear-gradient(90deg,#00f0ff,#b44bff,#ff0080,#00ff88,#00f0ff)' }} />
                  )}
                  <span className="relative">{FRAME_LABELS[f]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Banner do card ── */}
        <div className="px-6 pb-4 border-t border-white/[0.05] pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-[#6666aa] uppercase tracking-wider flex items-center gap-1.5">
              <Image className="h-3 w-3" /> Banner da daily
            </p>
            <p className="text-[10px] text-[#333355]">Aparece no topo do seu card durante a daily</p>
          </div>

          {/* Preview */}
          {bannerUrl && (
            <div className="relative h-20 rounded-xl overflow-hidden mb-3 border border-white/[0.07]">
              <img src={bannerUrl} alt="banner" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#05050f]/70" />
            </div>
          )}

          <AnimatePresence>
            {editingBanner ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 overflow-hidden">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#444466]" />
                    <Input
                      value={bannerInput}
                      onChange={e => setBannerInput(e.target.value)}
                      placeholder="Cole um URL de imagem ou GIF..."
                      className="neon-input h-9 text-sm pl-7"
                    />
                  </div>
                  <button onClick={saveBannerUrl}
                    className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] text-xs font-medium hover:bg-[#00ff88]/20 transition-colors shrink-0">
                    <Check className="h-3.5 w-3.5" /> Salvar
                  </button>
                  <button onClick={() => { setEditingBanner(false); setBannerInput(bannerUrl) }}
                    className="flex items-center px-2.5 h-9 rounded-lg border border-white/[0.08] text-[#444466] hover:text-white transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-[#333355]">Ou faça upload de uma imagem/GIF:</p>
                <div className="flex gap-2">
                  <button onClick={() => bannerRef.current?.click()} disabled={uploadingBanner}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] text-[#6666aa] text-xs hover:text-[#00f0ff] hover:border-[#00f0ff]/30 transition-colors disabled:opacity-50">
                    {uploadingBanner
                      ? <span className="h-3 w-3 rounded-full border border-[#00f0ff] border-t-transparent animate-spin" />
                      : <Camera className="h-3.5 w-3.5" />}
                    {uploadingBanner ? 'Enviando...' : 'Fazer upload'}
                  </button>
                  {bannerUrl && (
                    <button onClick={removeBanner}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#ff0055]/20 text-[#ff0055]/60 text-xs hover:text-[#ff0055] hover:border-[#ff0055]/40 transition-colors">
                      <Trash2 className="h-3 w-3" /> Remover banner
                    </button>
                  )}
                </div>
                <input ref={bannerRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleBannerUpload} />
              </motion.div>
            ) : (
              <button onClick={() => setEditingBanner(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-white/[0.15] text-[#444466] text-xs hover:text-[#00f0ff] hover:border-[#00f0ff]/30 transition-colors w-full justify-center">
                <Pencil className="h-3 w-3" />
                {bannerUrl ? 'Alterar banner' : 'Adicionar banner / GIF'}
              </button>
            )}
          </AnimatePresence>
        </div>

        {/* ── Sticker shelf ── */}
        <div className="px-6 pb-5 border-t border-white/[0.05] pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold text-[#6666aa] uppercase tracking-wider">
              Stickers ({stickers.length}/8)
            </p>
            <p className="text-[10px] text-[#333355]">Clique para remover · slot vazio para adicionar</p>
          </div>
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 8 }, (_, i) => {
              const sticker = stickers.find(s => s.position === i)
              return (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sticker ? removeSticker(i) : setPickerSlot(i)}
                  title={sticker ? `Remover ${sticker.emoji}` : 'Adicionar sticker'}
                  className={cn(
                    'h-10 w-full flex items-center justify-center rounded-xl border text-xl transition-all',
                    sticker
                      ? 'border-white/[0.12] bg-white/[0.04] hover:border-[#ff0055]/40 hover:bg-[#ff0055]/05'
                      : 'border-dashed border-white/[0.1] bg-transparent hover:border-[#00f0ff]/40 hover:bg-[#00f0ff]/05 text-[#222244] hover:text-[#00f0ff]/60'
                  )}
                >
                  {sticker ? sticker.emoji : <span className="text-xs">+</span>}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Sticker picker modal ── */}
      <AnimatePresence>
        {pickerSlot !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setPickerSlot(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="neon-card rounded-2xl p-5 border border-[#00f0ff]/20 w-full max-w-xs"
              style={{ boxShadow: '0 0 40px rgba(0,240,255,0.1)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-[#6666aa] uppercase tracking-wider">Slot {pickerSlot + 1} — Escolha um sticker</p>
                <button onClick={() => setPickerSlot(null)} className="text-[#444466] hover:text-white transition-colors"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {AVAILABLE_STICKERS.map(emoji => (
                  <motion.button key={emoji} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                    onClick={() => placeSticker(emoji)}
                    className="text-2xl h-10 w-full flex items-center justify-center rounded-xl hover:bg-white/[0.08] transition-colors">
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Badges ── */}
      <div className="neon-card rounded-2xl border border-white/[0.07] overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.05]">
          <p className="text-[10px] font-semibold text-[#6666aa] uppercase tracking-wider">
            Conquistas — {unlockedBadges.size}/{Object.keys(BADGE_INFO).length} desbloqueadas
          </p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(BADGE_INFO).map(([tipo, info]) => {
            const unlocked = unlockedBadges.has(tipo as BadgeTipo)
            return (
              <motion.div key={tipo} whileHover={unlocked ? { scale: 1.02 } : {}}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all',
                  unlocked ? 'border-white/[0.1] bg-white/[0.03]' : 'border-white/[0.04] opacity-30'
                )}>
                <span className="text-2xl">{info.emoji}</span>
                <div>
                  <p className={cn('text-sm font-medium', unlocked ? 'text-white' : 'text-[#444466]')}>{info.label}</p>
                  <p className="text-[10px] text-[#333355]">{info.descricao}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Histórico ── */}
      {historico.length > 0 && (
        <div className="neon-card rounded-2xl border border-white/[0.07] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.05]">
            <p className="text-[10px] font-semibold text-[#6666aa] uppercase tracking-wider">Histórico de pontos</p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {historico.map(item => (
              <div key={item.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-[#6666aa] truncate">{item.motivo}</span>
                <span className="text-[#00ff88] font-mono font-semibold ml-4 shrink-0">+{item.pontos}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
