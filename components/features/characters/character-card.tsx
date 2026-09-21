'use client'

import { renderIcon } from '@/lib/utils/icon'
import { Character } from '@/lib/types/character'
import { AvatarRenderer } from './avatars/avatar-renderer'
import { getProgressPercentage } from '@/lib/utils/character'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from '@/components/ui/card'
import { cn } from '@/lib/utils/general'

interface CharacterCardProps {
  character: Character
  onClick?: (character: Character) => void
  className?: string
}

// =======================================
// MAIN COMPONENT
// =======================================

export function CharacterCard({ 
    character, 
    onClick, 
    className 
  }: CharacterCardProps) {
  const progressPercentage = getProgressPercentage(character.current_xp, character.xp_to_next_level)
  const avatar = character.avatar

  const handleClick = () => {
    if (onClick) {
      onClick(character)
    }
  }

  return (
    <Card
      onClick={handleClick}
      className={cn(
        'group relative flex flex-row gap-0 rounded-xl border py-4 bg-card overflow-hidden transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
        character.is_archived && 'opacity-60',
        className
      )}
    >
      {/* Color theme accent bar */}
      <div
        className="h-full w-1 shrink-0 rounded-b-full"
        style={{ backgroundColor: character.character_color }}
      />

      <CardContent className="min-w-0 flex-1 flex flex-col gap-3 px-0">
        <CardHeader className="flex flex-col items-stretch gap-3 px-0">
          {/* Avatar banner (if set) */}
          {avatar && (
            <div
              className="flex justify-center rounded-r-3xl border border-l-0 overflow-hidden py-2 px-4"
              style={{
                backgroundColor: character.character_color + '22',
                borderColor: character.character_color + '66',
              }}
            >
              <AvatarRenderer
                archetypeId={avatar}
                color={character.avatar_color}
                size={96}
              />
            </div>
          )}

          {/* Icon, Title & Level */}
          <div className="flex items-center gap-3 min-w-0 px-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
              style={{
                backgroundColor: character.character_color + '18',
                borderColor: character.character_color + '55',
              }}
            >
              {renderIcon(character.icon.value, character.icon.type, character.icon.color, 'w-5 h-5')}
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'text-sm font-semibold leading-tight truncate',
                  character.is_archived && 'text-muted-foreground'
                )}
              >
                {character.title}
              </p>
              {character.is_archived && (
                <span className="text-xs text-muted-foreground">Archived</span>
              )}
            </div>

            <div
              className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold tabular-nums"
              style={{
                backgroundColor: character.character_color + '22',
                color: character.character_color,
                borderColor: character.character_color + '66',
              }}
            >
              Lv {character.level}
            </div>
          </div>
        </CardHeader>

        {/* XP progress */}
        <div className="space-y-2 px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {character.xp_to_next_level - character.current_xp}xp to level up!
              </div>
            <div className="text-sm text-muted-foreground">
              XP: {character.current_xp} / {character.xp_to_next_level}
              </div>
          </div>
          <div className='flex items-center justify-between gap-4'>
            <span className="text-sm text-muted-foreground">
              {Math.floor((character.current_xp / character.xp_to_next_level) * 100)}%</span>
            <Progress
              value={progressPercentage}
              className="h-2"
              style={{ backgroundColor: character.character_color + '33' }}
              indicatorStyle={{ backgroundColor: character.character_color }} />
          </div>
          <p className="text-xs text-muted-foreground text-right tabular-nums">
            {character.total_xp.toLocaleString()} total XP
          </p>
        </div>

        {/* Description */}
        {character.description && (
          <CardDescription className="px-4 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {character.description}
          </CardDescription>
        )}

        {/* Linked Skills */}
        <CardFooter className="mt-auto flex flex-wrap px-4 items-start gap-2">
          <p className='w-full text-sm font-medium'>
            {character.skills && character.skills.length > 0
              ? 'Linked Skills:'
              : 'No skills linked to this character.'}
          </p>
          {character.skills?.map((skill) => (
            <div
              key={skill.id}
              className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-colors`}
              style={{borderColor:`${skill.icon.color}`}}
            >
              {renderIcon(skill.icon.value, skill.icon.type, skill.icon.color, 'w-4 h-4')}
              <span className="text-xs font-medium truncate flex-1 max-w-32">
                {skill.title}
              </span>
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{borderColor:`${skill.icon.color}`}}>
                  Lv {skill.level}
              </Badge>
            </div>
          )) }
        </CardFooter>
      </CardContent>
    </Card>
  )
}