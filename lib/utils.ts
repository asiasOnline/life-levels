import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDueDate(dateString: string): { label: string; overdue: boolean; urgent: boolean } {
  const due = new Date(dateString)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { label: `${Math.abs(diffDays)}d overdue`, overdue: true, urgent: false }
  }
  if (diffDays === 0) return { label: 'Due today', overdue: false, urgent: true }
  if (diffDays === 1) return { label: 'Due tomorrow', overdue: false, urgent: true }
  if (diffDays <= 7) return { label: `${diffDays}d left`, overdue: false, urgent: true }

  return {
    label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    overdue: false,
    urgent: false,
  }
}