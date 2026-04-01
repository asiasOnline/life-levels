'use client'

import { useEffect, useRef, useState } from 'react'
import { useGold } from '@/lib/contexts/gold-context'
import { cn } from '@/lib/utils/general'
import { FaCoins } from "react-icons/fa6";

// ----------------------------------------------------------------
// useCountUp
// Animates from a previous value to a new value over ~600ms.
// Returns the current display value during the transition.
// ----------------------------------------------------------------

function useCountUp(target: number, duration = 600): number {
  const [displayed, setDisplayed] = useState(target)
  const prevRef = useRef(target)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const from = prevRef.current
    if (from === target) return

    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(from + (target - from) * eased))

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        prevRef.current = target
        setDisplayed(target)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target, duration])

  return displayed
}

// ----------------------------------------------------------------
// GoldDeltaToast
// Floating +/- notification that fades up and out.
// ----------------------------------------------------------------

interface GoldDeltaToastProps {
  amount: number
  type: 'goldReceived' | 'goldRedeemed'
}

function GoldDeltaToast({ amount, type }: GoldDeltaToastProps) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2',
        'text-xs font-semibold tabular-nums',
        'animate-gold-delta',
        type === 'goldReceived' ? 'text-amber-500' : 'text-amber-700/70'
      )}
      aria-hidden="true"
    >
      {type === 'goldRedeemed' ? '+' : '-'}{amount}
    </span>
  )
}

// ----------------------------------------------------------------
// GoldContainer
//
// Props:
//   size     — 'sm' for header/nav, 'md' (default) for dashboard,
//              'lg' for the Rewards shop page
//   variant  — 'pill' (default) compact capsule, 'card' larger
//              display with label for prominent placements
//   className — additional Tailwind classes
// ----------------------------------------------------------------

interface GoldContainerProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'pill' | 'card'
  className?: string
}

export function GoldContainer({
  size = 'md',
  variant = 'pill',
  className,
}: GoldContainerProps) {
  const { balance, isLoading, deltas } = useGold()
  const displayedBalance = useCountUp(balance)

  if (isLoading) {
    return (
      <div
        className={cn(
          'animate-pulse rounded-full bg-amber-100/60 dark:bg-amber-900/20',
          size === 'sm' && 'h-7 w-20',
          size === 'md' && 'h-9 w-24',
          size === 'lg' && 'h-11 w-32',
          className
        )}
        aria-label="Loading gold balance"
      />
    )
  }

  // ── Pill variant ──────────────────────────────────────────────
  if (variant === 'pill') {
    return (
      <div
        className={cn(
          'relative inline-flex items-center gap-1.5 select-none',
          'rounded-full border',
          'bg-amber-50 border-amber-200/80 text-amber-700',
          'dark:bg-amber-950/40 dark:border-amber-700/40 dark:text-amber-400',
          'transition-all duration-200',
          // Subtle flash on balance change
          deltas.length > 0 && 'ring-2 ring-amber-400/40 dark:ring-amber-500/30',
          size === 'sm' && 'px-2.5 py-1',
          size === 'md' && 'px-3 py-1.5',
          size === 'lg' && 'px-4 py-2',
          className
        )}
        aria-label={`Gold balance: ${displayedBalance}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Delta toasts — one per queued change */}
        {deltas.map(delta => (
          <GoldDeltaToast
            key={delta.id}
            amount={delta.amount}
            type={delta.type}
          />
        ))}

        <FaCoins
          className={cn(
            'shrink-0 text-amber-500 dark:text-amber-400',
            size === 'sm' && 'h-3.5 w-3.5',
            size === 'md' && 'h-4 w-4',
            size === 'lg' && 'h-5 w-5',
          )}
        />

        <span
          className={cn(
            'tabular-nums font-semibold tracking-tight',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
          )}
        >
          {displayedBalance.toLocaleString()}
        </span>
      </div>
    )
  }

  // ── Card variant ──────────────────────────────────────────────
  return (
    <div
      className={cn(
        'relative flex flex-col items-center gap-1 select-none',
        'rounded-xl border px-6 py-4',
        'bg-amber-50 border-amber-200/80',
        'dark:bg-amber-950/30 dark:border-amber-700/30',
        'transition-all duration-200',
        deltas.length > 0 && 'ring-2 ring-amber-400/40 dark:ring-amber-500/30',
        className
      )}
      aria-label={`Gold balance: ${displayedBalance}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {deltas.map(delta => (
        <GoldDeltaToast
          key={delta.id}
          amount={delta.amount}
          type={delta.type}
        />
      ))}

      <div className="flex items-center gap-2">
        <FaCoins className="h-7 w-7 text-amber-500 dark:text-amber-400 shrink-0" />
        <span
          className={cn(
            'tabular-nums font-bold tracking-tight text-amber-700 dark:text-amber-300',
            size === 'md' && 'text-3xl',
            size === 'lg' && 'text-4xl',
          )}
        >
          {displayedBalance.toLocaleString()}
        </span>
      </div>

      <span className="text-xs font-medium text-amber-600/70 dark:text-amber-500/70 uppercase tracking-wider">
        Gold
      </span>
    </div>
  )
}