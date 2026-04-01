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
  CardFooter} from '@/components/ui/card'
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

  // Effective clothing color: explicit override, or falls back to character's color theme
  const clothingColor = avatar?.clothing_color ?? character.color_theme

  const handleClick = () => {
    if (onClick) {
      onClick(character)
    }
  }

  return (
    <Card
      onClick={handleClick}
      className={cn(
        'group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
        character.is_archived && 'opacity-60',
        className
      )}
    >
      {/* Color theme accent bar */}
      <div
        className="h-1 w-full shrink-0"
        style={{ backgroundColor: character.color_theme }}
      />

      <CardContent className="flex flex-col flex-1 p-4 gap-4">

        {/*  Icon, Title & Level */}
        <CardHeader className="flex items-start justify-between gap-3">
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
            className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums"
            style={{
              backgroundColor: character.color_theme + '22',
              color: character.color_theme,
            }}
          >
            Lv {character.level}
          </div>
        </CardHeader>

        {/* Avatar Preview (if set) */}
        {avatar && (
        <div className="flex items-center gap-3">
          <div
            className="shrink-0 rounded-xl border overflow-hidden"
            style={{
              backgroundColor: clothingColor + '22',
              borderColor: clothingColor + '55',
            }}
          >
            <AvatarRenderer
              archetypeId={avatar.archetype_id}
              skinTone={avatar.skin_tone}
              clothingColor={clothingColor}
              size={48}
            />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full border border-border/50"
                style={{ backgroundColor: avatar.skin_tone }}
              />
              <span className="text-xs text-muted-foreground capitalize">
                {avatar.archetype_id}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full border border-border/50"
                style={{ backgroundColor: clothingColor }}
              />
              <span className="text-xs text-muted-foreground">
                {avatar.clothing_color ? 'Custom color' : 'Theme color'}
              </span>
            </div>
          </div>
        </div>
      )}

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
        <div className="space-y-2 pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{character.xp_to_next_level - character.current_xp} to level up!</div>
            <div className="text-sm text-muted-foreground">XP: {character.current_xp} / {character.xp_to_next_level}</div>
          </div>
          <div className='flex items-center justify-between gap-4'>
            <span className="text-sm text-muted-foreground">{Math.floor((character.current_xp / character.xp_to_next_level) * 100)}%</span>
            <Progress value={progressPercentage} className="h-2" style={{ backgroundColor: character.color_theme }} />
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