import React from 'react'

const TaskTableViewHeader = () => {
  return (
    <thead>
      <tr className="border-b border-border/60">
        <th className="w-8 pb-2" /> {/* status bar */}
        <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground">Task</th>
        <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground">Description</th>
        <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Start Date</th>
        <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">Due Date</th>
        <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground">Priority</th>
        <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground">Difficulty</th>
        <th className="pb-2 pr-4 text-right text-xs font-medium text-muted-foreground">Gold</th>
        <th className="pb-2 pr-4 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">Char XP</th>
        <th className="pb-2 text-right text-xs font-medium text-muted-foreground whitespace-nowrap">Skill XP</th>
      </tr>
    </thead>
  )
}

export default TaskTableViewHeader