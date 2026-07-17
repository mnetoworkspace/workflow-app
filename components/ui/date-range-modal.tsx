'use client'

import { useState } from 'react'
import {
  format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isToday, isSameMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface DateRange {
  from: string | null
  to: string | null
}

export const EMPTY_RANGE: DateRange = { from: null, to: null }

const WEEK_DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export function formatRange(range: DateRange): string | null {
  if (!range.from) return null
  if (!range.to || range.from === range.to) {
    return format(parseISO(range.from), "d 'de' MMM yyyy", { locale: ptBR })
  }
  return `${format(parseISO(range.from), 'dd/MM/yy')} – ${format(parseISO(range.to), 'dd/MM/yy')}`
}

/**
 * Modal ÚNICO de seleção de data do sistema — sempre no modelo date range:
 * 1º clique marca o início; clicar na MESMA data = dia único;
 * clicar em OUTRA data = intervalo. Todo lugar que mexe com data usa este componente.
 */
export default function DateRangeModal({
  value,
  onChange,
  title = 'Selecionar data',
  placeholder = 'Selecionar data',
  markedDates,
  onlyMarked = false,
  disableFuture = false,
  allowClear = true,
  triggerClassName,
}: {
  value: DateRange
  onChange: (range: DateRange) => void
  title?: string
  placeholder?: string
  markedDates?: Set<string>
  onlyMarked?: boolean
  disableFuture?: boolean
  allowClear?: boolean
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState<Date>(() => (value.from ? parseISO(value.from) : new Date()))
  const [pending, setPending] = useState<string | null>(null)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const label = formatRange(value)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setPending(null)
      setMonth(value.from ? parseISO(value.from) : new Date())
    }
  }

  function handleDayClick(dateStr: string) {
    if (!pending) {
      setPending(dateStr)
      return
    }
    // 2º clique: mesma data = dia único; outra data = intervalo (sempre ordenado)
    const [from, to] = pending <= dateStr ? [pending, dateStr] : [dateStr, pending]
    onChange({ from, to })
    setPending(null)
    setOpen(false)
  }

  function clear() {
    onChange(EMPTY_RANGE)
    setPending(null)
    setOpen(false)
  }

  const firstDay = startOfMonth(month)
  const days = eachDayOfInterval({ start: firstDay, end: endOfMonth(month) })
  const offset = (getDay(firstDay) + 6) % 7 // Monday-first
  const isCurrentMonth = isSameMonth(month, new Date())
  const monthLabel = format(month, "MMMM 'de' yyyy", { locale: ptBR })

  // Durante a seleção pendente, só o início fica marcado
  const selFrom = pending ?? value.from
  const selTo = pending ? null : value.to

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <button
            type="button"
            className={cn(
              'flex items-center gap-2 h-9 px-3 rounded-md border text-xs transition-colors',
              'bg-white/[0.02] border-white/[0.1] hover:border-[#00f0ff]/40',
              label ? 'text-white' : 'text-[#6666aa]',
              triggerClassName,
            )}
          />
        }
      >
        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#00f0ff]" />
        <span className="truncate">{label ?? placeholder}</span>
      </DialogTrigger>

      <DialogContent className="bg-[#0a0a22] border border-[#00f0ff]/20 sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#00f0ff]" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Month nav */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth(subMonths(month, 1))}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-[#6666aa] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-white capitalize">{monthLabel}</p>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            disabled={disableFuture && isCurrentMonth}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-[#6666aa] hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Week headers */}
        <div>
          <div className="grid grid-cols-7 mb-1">
            {WEEK_DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-medium text-[#444466] py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: offset }).map((_, i) => <div key={`empty-${i}`} />)}

            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const marked = markedDates?.has(dateStr) ?? false
              const disabled =
                (onlyMarked && !marked) ||
                (disableFuture && dateStr > todayStr)
              const isEndpoint = dateStr === selFrom || dateStr === selTo
              const inRange = !!selFrom && !!selTo && dateStr > selFrom && dateStr < selTo
              const isPending = pending === dateStr

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => !disabled && handleDayClick(dateStr)}
                  disabled={disabled}
                  className={cn(
                    'relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-all text-sm',
                    !disabled && !isEndpoint && !inRange && 'hover:bg-white/[0.06] cursor-pointer',
                    inRange && 'bg-[#00f0ff]/10',
                    isEndpoint && 'bg-gradient-to-b from-[#b44bff]/30 to-[#00f0ff]/15',
                    isPending && 'ring-1 ring-[#b44bff]/60',
                    isToday(day) && !isEndpoint && 'ring-1 ring-[#00f0ff]/25',
                    disabled && 'cursor-default',
                  )}
                >
                  <span className={cn(
                    'text-sm font-medium leading-none',
                    isEndpoint ? 'text-white' :
                    inRange    ? 'text-[#c8c8e8]' :
                    disabled   ? 'text-[#2a2a44]' : 'text-[#c8c8e8]',
                  )}>
                    {format(day, 'd')}
                  </span>
                  {marked && (
                    <div className={cn('h-1 w-1 rounded-full mt-1', isEndpoint ? 'bg-[#b44bff]' : 'bg-[#00f0ff]')} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Hint + ações */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/[0.05]">
          <p className="text-[10px] text-[#444466] leading-snug">
            {pending
              ? 'Clique na mesma data para dia único, ou em outra para fechar o período'
              : '1º clique marca o início da seleção'}
          </p>
          {allowClear && (value.from || pending) && (
            <button
              type="button"
              onClick={clear}
              className="text-[10px] text-[#6666aa] hover:text-[#ff0055] transition-colors shrink-0"
            >
              Limpar
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
