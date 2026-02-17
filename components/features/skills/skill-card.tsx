'use client'

import React from 'react' 
import { Skill } from '@/lib/types/skills'
import { getProgressPercentage } from '@/lib/utils/skills'
import { renderIcon } from '@/components/layout/app/icon-picker/icon-utils'
import { Badge } from '@/components/ui/badge'
import {Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'


interface SkillCardProps {
  skill: Skill;
  onClick?: (skill: Skill) => void;
  className?: string;
}

export function SkillCard ({ skill, onClick, className }: SkillCardProps) {
  const progressPercentage = getProgressPercentage(skill.currentXP, skill.xpToNextLevel)

  const handleClick = () => {
    if (onClick) {
      onClick(skill)
    }
  }

  return (
    <Card className={cn(
      'w-full max-w-120 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.005]', 
      className)}
      onClick={handleClick}
      >
      {/* Icon, Title & Level */}
      <CardHeader className='min-h-12'>
        <div className='flex items-start justify-between space-x-4'>
          <div className="text-2xl">
            {renderIcon(skill.icon, skill.iconType, skill.iconColor, 'w-6 h-6')}
          </div>
          <CardTitle className='leading-[150%]'>{skill.title}</CardTitle>
          <Badge variant="secondary">LVL | {skill.level}</Badge>
        </div>
      </CardHeader>
      <CardContent>

        {/* Description */}
        <CardDescription>{skill.description}</CardDescription>

        {/* XP Progress */}
        <div className="space-y-2 pt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">{skill.xpToNextLevel - skill.currentXP} to level up!</div>
            <div className="text-sm text-muted-foreground">XP: {skill.currentXP} / {skill.xpToNextLevel}</div>
          </div>
          <div className='flex items-center justify-between gap-4'>
            <span className="text-sm text-muted-foreground">{Math.floor((skill.currentXP / skill.xpToNextLevel) * 100)}%</span>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </CardContent>
      <CardFooter>

        {/* Tags */}
        {skill.tags && skill.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-3">
            {skill.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
