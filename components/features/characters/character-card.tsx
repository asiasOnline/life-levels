'use client'

import { renderIcon } from '@/lib/utils/icon'
import { Character } from '@/lib/types/character'
import { CharacterAvatarData } from '@/lib/types/character'
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
  const avatar = character.avatar as CharacterAvatarData | null

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
        style={{ backgroundColor: character.color_theme }}
      />

      <CardContent className="w-full flex flex-col gap-2 px-0 pb-4">

      <CardHeader className="flex justify-start items-center gap-3 px-0">
      {/* Avatar Preview (if set) */}
        {avatar && (
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-full rounded-tr-3xl rounded-br-3xl border overflow-hidden py-2 px-4"
            style={{
              backgroundColor: character.color_theme  + '22',
              borderColor: character.color_theme  + '66',
            }}
          >
            <div className='flex justify-center min-h-24'>
            <AvatarRenderer
              archetypeId={avatar.archetype_id}
              skinTone={avatar.skin_tone as 'light' | 'mediumLight' | 'medium' | 'mediumDark' | 'deep'}
              size={96}
            />
            </div>
          </div>

        </div>
        )}

        {/*  Icon, Title & Level */}
        <div className='flex flex-col gap-3'>
          <div className="flex items-center gap-3 min-w-0">
            {/* Icon */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
              style={{
                backgroundColor: character.color_theme + '18',
                borderColor: character.color_theme + '55',
              }}
            >
              {renderIcon(character.icon.value, character.icon.type, character.icon.color, 'w-5 h-5')}
            </div>

            {/* Title & Archive Badge */}
            <div className="min-w-0">
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
          </div>

          {/* Level Badge */}
            <div
              className="w-16 flex justify-center border shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums"
              style={{
                backgroundColor: character.color_theme + '22',
                color: character.color_theme,
                borderColor: character.color_theme  + '66',
              }}
            >
              Lv {character.level}
            </div>
          </div>
        </CardHeader>

        {/* Spacer pushes XP bar to bottom */}
        <div />
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
              style={{ backgroundColor: character.color_theme }} />
          </div>
          <p className="text-xs text-muted-foreground text-right tabular-nums">
            {character.total_xp.toLocaleString()} total XP
          </p>
        </div>

        {/* Description */}
        <CardDescription className="px-4 pt-2 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {character.description && (
          <p>
            {character.description}
          </p>
        )}
        </CardDescription>

        {/* Linked Skills */}
        <CardFooter className="flex flex-col px-4 items-start gap-2">
          <p className='text-sm font-medium'>
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