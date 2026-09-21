import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Shared chrome for the dedicated detail pages (/tasks/[id], /goals/[id], ...)

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  )
}

export function DetailLoading({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">{message}</p>
    </div>
  )
}

export function DetailNotFound({
  entity,
  backHref,
  backLabel,
}: {
  entity: string
  backHref: string
  backLabel: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 h-64 text-center">
      <p className="font-semibold">{entity} not found</p>
      <p className="text-sm text-muted-foreground">
        It may have been deleted, or the link is incorrect.
      </p>
      <Button asChild variant="outline">
        <Link href={backHref}>{backLabel}</Link>
      </Button>
    </div>
  )
}
