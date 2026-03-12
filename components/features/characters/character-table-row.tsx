'use client'

import { Database } from '@/lib/database.types'
import { renderIcon } from '@/lib/utils/icon'
import { getProgressPercentage } from '@/lib/utils/character'
import { Character } from '@/lib/types/character'
import { CharacterAvatarData } from '@/lib/types/character'
import { 
  TableHeader,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface CharacterTableRowProps {
  character: Character
  onClick?: (character: Character) => void
  className?: string
}

// =======================================
// AVATAR ARCHETYPES (mirrors CreateCharacterModal)
// =======================================

const AVATAR_ARCHETYPES: Record<string, string> = {
  warrior:   '⚔️',
  scholar:   '📚',
  explorer:  '🧭',
  athlete:   '🏃',
  artisan:   '🎨',
  mystic:    '🔮',
  healer:    '💚',
  architect: '🏛️',
}

// =======================================
// HELPERS
// =======================================

function InlineXPBar({
  currentXP,
  xpToNextLevel,
  color,
}: {
  currentXP: number
  xpToNextLevel: number
  color: string
}) {
  const pct = Math.min(100, Math.round((currentXP / xpToNextLevel) * 100))

  return (
    <div className="flex items-center gap-2 min-w-30">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
        {pct}%
      </span>
    </div>
  )
}

// =======================================
// TABLE HEADER
// =======================================

export function CharacterTableHeader({
  character,
  onClick
}: CharacterTableRowProps) {

  return (
    <TableHeader>
      <TableRow className="border-b border-border/60">
        <TableHead className="w-1 pb-2" /> {/* color theme bar */}
        <TableHead className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground">
          Character
        </TableHead>
        <TableHead className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground">
          Description
        </TableHead>
        <TableHead className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground">
          Avatar
        </TableHead>
        <TableHead className="pb-2 pr-4 text-center text-xs font-medium text-muted-foreground">
          Level
        </TableHead>
        <TableHead className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground min-w-35">
          Level Progress
        </TableHead>
        <TableHead className="pb-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">
          Total XP
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}

// =======================================
// MAIN COMPONENT
// =======================================

export function CharacterTableRow({
  character,
  onClick,
  className,
}: CharacterTableRowProps) {
  const avatar = character.avatar as unknown as CharacterAvatarData | null

  const avatarEmoji = avatar ? AVATAR_ARCHETYPES[avatar.archetype_id] : null
  const clothingColor = avatar?.clothing_color ?? character.color_theme

  const handleClick = () => {
    if (onClick) {
      onClick(character)
    }
  }

  return (
    <TableRow
      onClick={handleClick}
      className={cn(
        'group border-b border-border/40 transition-colors',
        onClick && 'cursor-pointer hover:bg-muted/30',
        character.is_archived && 'opacity-50',
        className
      )}
    >
      {/* Color theme accent bar */}
      <TableCell className="py-3 pr-2 w-1">
        <div
          className="w-0.5 h-8 rounded-full mx-auto"
          style={{ backgroundColor: character.color_theme }}
        />
      </TableCell>

      {/* Icon + Title */}
      <TableCell className="py-3 pr-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
            style={{
              backgroundColor: character.color_theme + '18',
              borderColor: character.color_theme + '55',
            }}
          >
            {renderIcon(character.icon.value, character.icon.type, character.icon.color, 'w-6 h-6')}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground whitespace-nowrap truncate max-w-40">
              {character.title}
            </p>
            {character.is_archived && (
              <span className="text-xs text-muted-foreground">Archived</span>
            )}
          </div>
        </div>
      </TableCell>

      {/* Description */}
      <TableCell className="py-3 pr-4 max-w-55">
        {character.description ? (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {character.description}
          </p>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        )}
      </TableCell>

      {/* Avatar */}
      <TableCell className="py-3 pr-4">
        {avatarEmoji ? (
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-base border"
              style={{
                backgroundColor: clothingColor + '22',
                borderColor: clothingColor + '44',
              }}
            >
              {avatarEmoji}
            </div>
            <div className="flex items-center gap-1">
              <div
                className="w-2 h-2 rounded-full border border-border/40"
                style={{ backgroundColor: avatar!.skin_tone }}
              />
              <div
                className="w-2 h-2 rounded-full border border-border/40"
                style={{ backgroundColor: clothingColor }}
              />
            </div>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        )}
      </TableCell>

      {/* Level */}
      <TableCell className="py-3 pr-4 text-center">
        <span
          className="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums"
          style={{
            backgroundColor: character.color_theme + '22',
            color: character.color_theme,
          }}
        >
          {character.level}
        </span>
      </TableCell>

      {/* Level Progress bar */}
      <TableCell className="py-3 pr-4">
        <InlineXPBar
          currentXP={character.current_xp}
          xpToNextLevel={character.xp_to_next_level}
          color={character.color_theme}
        />
      </TableCell>

      {/* Total XP */}
      <TableCell className="py-3 text-right">
        <span className="text-sm font-medium tabular-nums">
          {character.total_xp.toLocaleString()}
        </span>
      </TableCell>
    </TableRow>
  )
}