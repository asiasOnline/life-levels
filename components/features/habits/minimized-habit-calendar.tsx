'use client'
import React, { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'

const MinimizedHabitCalendar = () => {
    const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <Calendar 
        mode='single'
        className="rounded-lg border"
    />
  )
}

export default MinimizedHabitCalendar