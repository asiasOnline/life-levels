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
        <CardTitle>{skill.title}</CardTitle>
        <CardDescription>{skill.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant="secondary">{skill.level}</Badge>
      </CardContent>
    </Card>
  )
}

export default SkillCard
