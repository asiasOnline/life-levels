'use client'

import React from 'react' 
import { SkillData } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SkillCardProps {
  skill: SkillData;
  onClick?: (skill: SkillData) => void;
  className?: string;
}

const SkillCard = ({ skill, onClick, className }: SkillCardProps) => {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="text-2xl mb-2">{skill.icon}</div>
        <CardTitle>{skill.title}</CardTitle>
        <Badge variant="secondary">LVL | {skill.level}</Badge>
      </CardHeader>
      <CardContent>
        <CardDescription>{skill.description}</CardDescription>
      </CardContent>
    </Card>
  )
}

export default SkillCard
