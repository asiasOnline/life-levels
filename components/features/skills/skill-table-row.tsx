'use client'

import React from 'react'
import { SkillData } from './types';
import { getProgressPercentage } from './utils';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';

interface SkillTableRowProps {
  skill: SkillData;
  onClick: (skill: SkillData) => void;
}

export function SkillTableRow({ skill, onClick }: SkillTableRowProps) {
  const progressPercentage = getProgressPercentage(skill.currentXP, skill.xpToNextLevel)

  const handleClick = () => {
    if (onClick) {
      onClick(skill)
    }
  }

  return (
    <TableRow 
        className="cursor-pointer hover:bg-accent"
        onClick={handleClick}
    >
    {/* Icon */}
      <TableCell className="text-2xl w-16">{skill.icon}</TableCell>

      <TableCell className="font-medium">{skill.title}</TableCell>
      <TableCell>{skill.level}</TableCell>
      <TableCell>
        <Badge variant="secondary">{skill.currentXP} XP</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-sm">{Math.floor(progressPercentage)}%</span>
        </div>
      </TableCell>
    </TableRow>
  )
}