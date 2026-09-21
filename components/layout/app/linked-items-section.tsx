import Link from 'next/link'
import { renderIcon } from '@/lib/utils/icon'
import { IconData } from '@/lib/types/icon'

interface LinkedItem {
  id: string
  title: string
  icon: IconData
  status: string
}

interface LinkedItemsSectionProps {
  label: string                       // e.g. "Goals"
  singular: string                    // e.g. "goal"
  basePath: string                    // e.g. "/goals" — each item links to `${basePath}/${id}`
  items: LinkedItem[]
  headerIcon: React.ReactNode
  iconBgClassName: string
}

// A titled list of related items, each linking to its own detail page.
// Used on the Skill and Character pages to show linked habits, tasks and goals.
export function LinkedItemsSection({
  label,
  singular,
  basePath,
  items,
  headerIcon,
  iconBgClassName,
}: LinkedItemsSectionProps) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBgClassName}`}>{headerIcon}</div>
        <div>
          <h4 className="font-medium">{label}</h4>
          <p className="text-sm text-muted-foreground">
            {items.length} linked {items.length === 1 ? singular : `${singular}s`}
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`${basePath}/${item.id}`}
                className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
              >
                <span className="shrink-0">
                  {renderIcon(item.icon.value, item.icon.type, item.icon.color, 'w-5 h-5')}
                </span>
                <span className="flex-1 truncate font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {item.status.replace(/_/g, ' ')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
