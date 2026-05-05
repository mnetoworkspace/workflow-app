'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function AddTaskForm({ userId, date }: { userId: string; date: string }) {
  const [titulo, setTitulo] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) return
    setLoading(true)
    const { error } = await supabase.from('tasks').insert({ user_id: userId, titulo: titulo.trim(), data: date, status: 'em_andamento' })
    if (error) { toast.error('Erro ao adicionar tarefa') }
    else { setTitulo(''); toast.success('Tarefa adicionada!'); router.refresh() }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="+ Nova tarefa para hoje..."
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="neon-input h-10 rounded-lg text-sm flex-1"
      />
      <motion.button
        type="submit"
        disabled={loading || !titulo.trim()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-1.5 px-4 h-10 rounded-lg text-sm font-medium bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 hover:bg-[#00f0ff]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        style={{ boxShadow: titulo.trim() ? '0 0 12px rgba(0,240,255,0.2)' : 'none' }}
      >
        <Plus className="h-3.5 w-3.5" />
        {loading ? '...' : 'Add'}
      </motion.button>
    </form>
  )
}
