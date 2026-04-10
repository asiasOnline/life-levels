'use client'

import React from 'react' 
import { Skill } from '@/lib/types/skills'
import { getProgressPercentage } from '@/lib/utils/skills'
import { CharacterSummaryWithLevel } from '@/lib/types/character'
import { renderIcon } from '@/lib/utils/icon'
import { Badge } from '@/components/ui/badge'
import {
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/general'


interface SkillCardProps {
  skill: Skill;
  onClick?: (skill: Skill) => void;
  className?: string;
}

export function SkillCard ({ 
  skill, 
  onClick, 
  className 
}: SkillCardProps) 
{
  const progressPercentage = getProgressPercentage(skill.current_xp, skill.xp_to_next_level)

  const handleClick = () => {
    if (onClick) {
      onClick(skill)
    }
  }

  return (
    <Card 
      onClick={handleClick}
      className={cn(
      'w-full max-w-120 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.005]', 
      className)}
      >
      {/* Icon, Title & Level */}
      <CardHeader className='min-h-4'>
        <div className='flex items-start justify-between space-x-4'>
          <div className='flex items-center gap-4'>
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
              style={{
                backgroundColor: skill.icon.color + '18',
                borderColor: skill.icon.color + '55',
              }}
            >
              {renderIcon(skill.icon.value, skill.icon.type, skill.icon.color, 'w-5 h-5')}
            </div>
            <CardTitle className='leading-[150%]'>{skill.title}</CardTitle>
          </div>
          <div
              className="w-16 flex justify-center border shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold tabular-nums"
              style={{
                backgroundColor: skill.icon.color + '22',
                color: skill.icon.color,
                borderColor: skill.icon.color  + '66',
              }}
            >
              Lv {skill.level}
            </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* XP Progress */}
        <div className="space-y-2 pb-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {skill.xp_to_next_level - skill.current_xp}xp to level up!
            </div>
            <div className="text-sm text-muted-foreground">
              XP: {skill.current_xp} / {skill.xp_to_next_level}
            </div>
          </div>
          <div className='flex items-center justify-between gap-4'>
            <span className="text-sm text-muted-foreground">
              {Math.floor((skill.current_xp / skill.xp_to_next_level) * 100)}%
              </span>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        {/* Description */}
        <CardDescription className="pt-2 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {skill.description}
        </CardDescription>

        {/* Tags */}
        {skill.tags && skill.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-2 pt-3">
            {skill.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-2">
        {/* Linked Characters */}
        <p className='text-sm font-medium'>
          {skill.characters && skill.characters.length > 0
            ? 'Linked Characters:'
            : 'No characters linked to this skill.'}
        </p>
        {skill.characters && skill.characters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skill.characters.map((character: CharacterSummaryWithLevel) => (
              <div
                key={character.id}
                className="flex items-center gap-2 rounded-lg border p-2 text-xs font-medium"
                style={{
                  borderColor: character.color_theme + '66',
                }}
              >
                <span className="shrink-0">
                  {renderIcon(character.icon.value, character.icon.type, character.icon.color, 'w-4 h-4')}
                </span>
                <span className="truncate max-w-32">{character.title}</span>
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{borderColor: character.color_theme + '66'}}>
                    Lv {character.level}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
