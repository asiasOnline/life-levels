'use client'

import React, { useMemo } from 'react'
import { Database } from '@/lib/database.types'
import { IconData } from '@/lib/types/icon'
import { renderIcon } from '@/lib/utils/icon'
import { Character } from '@/lib/types/character'
import { CharacterAvatarData } from '@/lib/types/character'
import { AvatarRenderer } from './avatars/avatar-renderer'
import { getProgressPercentage } from '@/lib/utils/character'
import { Progress } from '@/components/ui/progress'
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
            className="w-full rounded-tr-3xl rounded-br-3xl border overflow-hidden py-2 px-6"
            style={{
              backgroundColor: character.color_theme  + '22',
              borderColor: character.color_theme  + '66',
            }}
          >
            <div className='flex justify-center'>
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
              {renderIcon(character.icon.value, character.icon.type, character.icon.color, 'w-6 h-6')}
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
              className="w-32 flex justify-center border shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums"
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

        {/* Description */}
        <CardDescription>
          {character.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {character.description}
          </p>
        )}
        </CardDescription>

        {/* Spacer pushes XP bar to bottom */}
        <div className="flex-1" />

        {/* XP progress */}
        <div className="space-y-2 pt-4 px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {character.xp_to_next_level - character.current_xp} to level up!
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
        </div>

        {/* Total XP footnote */}
        <CardFooter>
          <p className="text-xs text-muted-foreground text-right tabular-nums">
            {character.total_xp.toLocaleString()} total XP
          </p>
        </CardFooter>
      </CardContent>
    </Card>
  )
}