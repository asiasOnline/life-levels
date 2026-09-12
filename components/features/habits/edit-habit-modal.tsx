'use client'

import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { IconPicker } from '@/components/layout/app/icon-picker'
import { IconType, IconData } from '@/lib/types/icon'
import { SkillSummary } from '@/lib/types/skills'
import { CharacterSummary } from '@/lib/types/character'
import {
  HabitRecurrence,
  HabitCompletionTime,
  HabitCustomRecurrenceConfig,
  HabitWithRelations,
  UpdateHabitInput,
} from '@/lib/types/habits'
import { updateHabit } from '@/lib/actions/habits'
import {
  calculateHabitRewards,
  getRecurrenceLabel,
  TIME_CONSUMPTION_OPTIONS,
  isCustomRecurrenceConfigComplete,
  isCustomRecurrenceTooFrequent,
} from '@/lib/utils/habits'
import { cn } from '@/lib/utils/general'
import { toast } from 'sonner'
import { Check, Clock, Coins, Repeat, Sparkles, Star, Zap } from 'lucide-react'
import { FieldSet, FieldGroup, FieldLabel } from '@/components/ui/field'

// ==========================================
// CONSTANTS
// ==========================================

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DEFAULT_ICON: IconData = { type: 'emoji', value: '🔄' }

// ===============================
// ZOD SCHEMA
// ===============================

const customRecurrenceSchema = z.object({
  interval: z.number().int().min(1, 'Must be at least 1'),
  unit: z.enum(['day', 'week', 'month']),
  end_type: z.enum(['never', 'on_date', 'after_occurrences']),
  end_date: z.string().optional(),
  occurrences: z.number().int().min(1).optional(),
})

const editHabitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  iconType: z.enum(['emoji', 'fontawesome', 'image']),
  iconColor: z.string().optional(),

  recurrence: z.enum(['daily', 'weekdays', 'x_per_week', 'weekly', 'bi_weekly', 'monthly', 'custom']),
  x_per_week_count: z.number().min(1).max(6).optional(),
  x_per_week_days: z.array(z.number().min(0).max(6)).optional(),
  weekly_day: z.number().min(0).max(6).optional(),
  monthly_day: z.number().min(1).max(31).optional(),
  custom_recurrence_config: customRecurrenceSchema.optional(),
  time_consumption: z.enum(['quick', 'medium', 'extended', 'long']),
  completion_time: z.enum(['morning', 'afternoon', 'evening', 'overnight']).optional(),

  skill_ids: z.array(z.string()).max(3, 'Max 3 skills'),
  character_ids: z.array(z.string()).max(3, 'Max 3 characters'),

  use_custom_xp: z.boolean(),
  custom_character_xp: z.number().min(0).optional(),
  custom_skill_xp: z.number().int().min(0).optional(),
  gold_reward: z.number().min(0).optional(),
})

type EditHabitFormValues = z.infer<typeof editHabitSchema>

// ================================
// PROPS
// ================================
interface EditHabitModalProps {
  isOpen: boolean
  onClose: () => void
  onHabitUpdated: () => void
  habit: HabitWithRelations | null
  availableSkills: SkillSummary[]
  availableCharacters: CharacterSummary[]
}

// ================================
// HELPERS
// ================================

function RewardPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border bg-muted/40 px-4 py-3 min-w-20">
      <div className="text-muted-foreground">{icon}</div>
      <span className="text-lg font-bold tabular-nums">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}

// ===============================
// MAIN COMPONENT
// ===============================

export function EditHabitModal({
  isOpen,
  onClose,
  onHabitUpdated,
  habit,
  availableSkills,
  availableCharacters,
}: EditHabitModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EditHabitFormValues>({
    resolver: zodResolver(editHabitSchema),
    defaultValues: {
      title: '',
      description: '',
      icon: DEFAULT_ICON.value,
      iconType: DEFAULT_ICON.type as 'emoji' | 'fontawesome' | 'image',
      recurrence: 'daily',
      time_consumption: 'quick',
      skill_ids: [],
      character_ids: [],
      use_custom_xp: false,
    },
  })

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = form

  // Re-populate the form whenever a different habit is opened for editing
  useEffect(() => {
    if (habit && isOpen) {
      const icon = habit.icon as IconData
      reset({
        title: habit.title,
        description: habit.description ?? '',
        icon: icon.value,
        iconType: icon.type as 'emoji' | 'fontawesome' | 'image',
        iconColor: icon.color,
        recurrence: habit.recurrence,
        x_per_week_count: habit.x_per_week_count,
        x_per_week_days: habit.x_per_week_days,
        weekly_day: habit.weekly_day,
        monthly_day: habit.monthly_day,
        custom_recurrence_config: habit.custom_recurrence_config ?? {
          interval: 1,
          unit: 'day',
          end_type: 'never',
        },
        time_consumption: habit.time_consumption,
        completion_time: habit.completion_time,
        skill_ids: habit.skills.map((s) => s.id),
        character_ids: habit.characters.map((c) => c.id),
        use_custom_xp: habit.use_custom_xp,
        custom_character_xp: habit.character_xp,
        custom_skill_xp: habit.skill_xp,
        gold_reward: habit.gold_reward,
      })
    }
  }, [habit, isOpen, reset])

  const recurrence = watch('recurrence')
  const timeConsumption = watch('time_consumption')
  const useCustomXp = watch('use_custom_xp')
  const skillIds = watch('skill_ids')
  const characterIds = watch('character_ids')
  const customConfig = watch('custom_recurrence_config')
  const xPerWeekDays = watch('x_per_week_days') ?? []

  const algorithmRewards = calculateHabitRewards(
    recurrence as HabitRecurrence,
    timeConsumption ?? 'quick',
    Math.max(1, skillIds?.length ?? 1),
    recurrence === 'custom' ? (customConfig as HabitCustomRecurrenceConfig | undefined) : undefined
  )
  const perSkillXp = skillIds?.length > 0
    ? Math.floor(algorithmRewards.skill_xp / skillIds.length)
    : algorithmRewards.skill_xp

  const onSubmit = async (values: EditHabitFormValues) => {
    if (!habit) return

    if (values.recurrence === 'custom') {
      if (!isCustomRecurrenceConfigComplete(values.custom_recurrence_config as HabitCustomRecurrenceConfig)) {
        toast.error('Please complete the custom recurrence settings.')
        return
      }
      if (isCustomRecurrenceTooFrequent(values.custom_recurrence_config as HabitCustomRecurrenceConfig)) {
        toast.error('Custom recurrence cannot exceed once per day. Create separate habits instead.')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const input: UpdateHabitInput = {
        id: habit.id,
        title: values.title,
        icon: values.icon || DEFAULT_ICON.value,
        icon_type: values.iconType,
        icon_color: values.iconColor,
        description: values.description || null,
        recurrence: values.recurrence as HabitRecurrence,
        time_consumption: values.time_consumption,
        completion_time: (values.completion_time as HabitCompletionTime) ?? null,
        skill_ids: values.skill_ids,
        character_ids: values.character_ids,
        use_custom_xp: values.use_custom_xp,
        x_per_week_count: null,
        x_per_week_days: null,
        weekly_day: null,
        monthly_day: null,
        custom_recurrence_config: null,
      }

      if (values.recurrence === 'x_per_week') {
        input.x_per_week_count = values.x_per_week_count ?? null
        input.x_per_week_days = values.x_per_week_days?.length ? values.x_per_week_days : null
      }
      if (values.recurrence === 'weekly') input.weekly_day = values.weekly_day ?? null
      if (values.recurrence === 'monthly') input.monthly_day = values.monthly_day ?? null
      if (values.recurrence === 'custom') {
        input.custom_recurrence_config = values.custom_recurrence_config as HabitCustomRecurrenceConfig
      }

      if (values.use_custom_xp) {
        input.character_xp = values.custom_character_xp
        input.skill_xp = values.custom_skill_xp
        input.gold_reward = values.gold_reward
      }

      const result = await updateHabit(input)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(`"${values.title}" has been updated.`)
      onHabitUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating habit:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleSkill = (id: string) => {
    const current = skillIds ?? []
    if (current.includes(id)) {
      setValue('skill_ids', current.filter((s) => s !== id), { shouldValidate: true })
    } else if (current.length < 3) {
      setValue('skill_ids', [...current, id], { shouldValidate: true })
    } else {
      toast.error('You can assign a maximum of 3 skills.')
    }
  }

  const toggleCharacter = (id: string) => {
    const current = characterIds ?? []
    if (current.includes(id)) {
      setValue('character_ids', current.filter((c) => c !== id), { shouldValidate: true })
    } else if (current.length < 3) {
      setValue('character_ids', [...current, id], { shouldValidate: true })
    } else {
      toast.error('You can assign a maximum of 3 characters.')
    }
  }

  const toggleXPerWeekDay = (day: number) => {
    const current = xPerWeekDays ?? []
    setValue(
      'x_per_week_days',
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
    )
  }

  const handleIconChange = (icon: string, iconType: IconType, iconColor?: string) => {
    form.setValue('icon', icon)
    form.setValue('iconType', iconType as 'emoji' | 'fontawesome' | 'image')
    if (iconColor) {
      form.setValue('iconColor', iconColor)
    }
  }

  if (!habit) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Habit</DialogTitle>
          <DialogDescription>
            Update this habit&apos;s details, or link skills and characters to it now
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Basics */}
          <FieldSet className="space-y-5 gap-4">
            <div className="flex items-start gap-3">
              <FieldGroup className="flex-1 min-w-12">
                <IconPicker
                  currentIcon={form.watch('icon') || DEFAULT_ICON.value}
                  currentIconType={form.watch('iconType') as IconType}
                  currentIconColor={form.watch('iconColor')}
                  onIconChange={handleIconChange}
                />
              </FieldGroup>

              <FieldGroup className="min-w-0 gap-2">
                <FieldLabel htmlFor="title" className="text-xs text-muted-foreground block">
                  Title <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="title"
                  placeholder="e.g. Morning Run, Read 20 Pages…"
                  {...register('title')}
                  className={cn(errors.title && 'border-destructive')}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </FieldGroup>
            </div>

            <div>
              <Label htmlFor="description" className="text-xs text-muted-foreground mb-1.5 block">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="What is this habit for? Any notes or context…"
                rows={3}
                {...register('description')}
                className="resize-none"
              />
            </div>
          </FieldSet>

          {/* Schedule */}
          <FieldSet className="space-y-5">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Recurrence <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="recurrence"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="How often?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekdays">Weekdays (Mon – Fri)</SelectItem>
                      <SelectItem value="x_per_week">X times per week</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi_weekly">Every 2 weeks</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {recurrence === 'x_per_week' && (
              <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">
                    Times per week <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="x_per_week_count"
                    control={control}
                    render={({ field }) => (
                      <Select value={String(field.value ?? 3)} onValueChange={(v) => field.onChange(Number(v))}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <SelectItem key={n} value={String(n)}>{n}×</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.x_per_week_count && (
                    <p className="text-xs text-destructive mt-1">{errors.x_per_week_count.message}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Preferred days <span className="text-muted-foreground/60">(optional)</span>
                  </Label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS_SHORT.map((day, i) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleXPerWeekDay(i)}
                        className={cn(
                          'w-9 h-9 rounded-lg text-xs font-medium border transition-colors',
                          xPerWeekDays.includes(i)
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-background text-foreground border-border hover:border-violet-400'
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {recurrence === 'weekly' && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Day of the week <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="weekly_day"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-1.5 flex-wrap">
                      {DAYS_FULL.map((day, i) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => field.onChange(i)}
                          className={cn(
                            'px-3 h-9 rounded-lg text-xs font-medium border transition-colors',
                            field.value === i
                              ? 'bg-violet-600 text-white border-violet-600'
                              : 'bg-background text-foreground border-border hover:border-violet-400'
                          )}
                        >
                          {DAYS_SHORT[i]}
                        </button>
                      ))}
                    </div>
                  )}
                />
                {errors.weekly_day && (
                  <p className="text-xs text-destructive mt-1">{errors.weekly_day.message}</p>
                )}
              </div>
            )}

            {recurrence === 'monthly' && (
              <div>
                <Label htmlFor="monthly_day" className="text-xs text-muted-foreground mb-1.5 block">
                  Day of the month <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="monthly_day"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="monthly_day"
                      type="number"
                      min={1}
                      max={31}
                      className="w-24"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  )}
                />
                {errors.monthly_day && (
                  <p className="text-xs text-destructive mt-1">{errors.monthly_day.message}</p>
                )}
              </div>
            )}

            {recurrence === 'custom' && (
              <div className="rounded-xl border bg-muted/30 p-4 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5" /> Custom Schedule
                </p>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground shrink-0">Every</span>
                  <Controller
                    name="custom_recurrence_config.interval"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        min={1}
                        className="w-20 text-center"
                        value={field.value ?? 1}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    )}
                  />
                  <Controller
                    name="custom_recurrence_config.unit"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">day(s)</SelectItem>
                          <SelectItem value="week">week(s)</SelectItem>
                          <SelectItem value="month">month(s)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Ends</Label>
                  <Controller
                    name="custom_recurrence_config.end_type"
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        {(['never', 'on_date', 'after_occurrences'] as const).map((opt) => (
                          <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                            <div
                              className={cn(
                                'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors',
                                field.value === opt ? 'border-violet-600 bg-violet-600' : 'border-muted-foreground'
                              )}
                              onClick={() => field.onChange(opt)}
                            >
                              {field.value === opt && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-sm capitalize">
                              {opt === 'never' ? 'Never' : opt === 'on_date' ? 'On a date' : 'After occurrences'}
                            </span>

                            {opt === 'on_date' && field.value === 'on_date' && (
                              <Controller
                                name="custom_recurrence_config.end_date"
                                control={control}
                                render={({ field: dateField }) => (
                                  <Input
                                    type="date"
                                    className="h-8 text-sm ml-1"
                                    value={dateField.value ?? ''}
                                    onChange={dateField.onChange}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                )}
                              />
                            )}

                            {opt === 'after_occurrences' && field.value === 'after_occurrences' && (
                              <div className="flex items-center gap-1.5 ml-1" onClick={(e) => e.stopPropagation()}>
                                <Controller
                                  name="custom_recurrence_config.occurrences"
                                  control={control}
                                  render={({ field: occField }) => (
                                    <Input
                                      type="number"
                                      min={1}
                                      className="w-20 h-8 text-sm text-center"
                                      value={occField.value ?? ''}
                                      onChange={(e) => occField.onChange(Number(e.target.value))}
                                    />
                                  )}
                                />
                                <span className="text-sm text-muted-foreground">times</span>
                              </div>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="time_consumption" className="text-xs text-muted-foreground mb-1.5 block">
                Time it takes <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="time_consumption"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="time_consumption"
                      className={cn('w-full', errors.time_consumption && 'border-destructive')}
                    >
                      <SelectValue placeholder="How long does this take?" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_CONSUMPTION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {opt.label}
                            <span className="text-xs text-muted-foreground">· {opt.hint}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.time_consumption && (
                <p className="text-xs text-destructive mt-1">{errors.time_consumption.message}</p>
              )}
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Preferred time of day <span className="text-muted-foreground/60">(optional)</span>
              </Label>
              <Controller
                name="completion_time"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2 flex-wrap">
                    {(['morning', 'afternoon', 'evening', 'overnight'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => field.onChange(field.value === t ? undefined : t)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors',
                          field.value === t
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-background text-foreground border-border hover:border-violet-400'
                        )}
                      >
                        {t === 'morning' ? '🌅' : t === 'afternoon' ? '☀️' : t === 'evening' ? '🌙' : '🌃'} {t}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>
          </FieldSet>

          {/* Assign */}
          <FieldSet className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs text-muted-foreground">
                  Skills <span className="text-muted-foreground">(optional)</span>
                </Label>
                <span className={cn(
                  'text-xs tabular-nums',
                  (skillIds?.length ?? 0) >= 3 ? 'text-amber-600' : 'text-muted-foreground'
                )}>
                  {skillIds?.length ?? 0} / 3
                </span>
              </div>
              {availableSkills.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No skills yet. Create one from the Skills page, then come back to link it here.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableSkills.map((skill) => {
                    const selected = skillIds?.includes(skill.id)
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggleSkill(skill.id)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all',
                          selected
                            ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                            : 'bg-background text-foreground border-border hover:border-violet-400'
                        )}
                      >
                        <span className="text-base leading-none">
                          {skill.icon.type === 'emoji' ? skill.icon.value : '⚡'}
                        </span>
                        {skill.title}
                        {selected && <Check className="w-3 h-3" />}
                      </button>
                    )
                  })}
                </div>
              )}
              {errors.skill_ids && <p className="text-xs text-destructive mt-1.5">{errors.skill_ids.message}</p>}
              <p className="text-xs text-muted-foreground mt-1.5">
                XP is split equally across all assigned skills.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label className="text-xs text-muted-foreground">
                  Characters <span className="text-muted-foreground">(optional)</span>
                </Label>
                <span className={cn(
                  'text-xs tabular-nums',
                  (characterIds?.length ?? 0) >= 3 ? 'text-amber-600' : 'text-muted-foreground'
                )}>
                  {characterIds?.length ?? 0} / 3
                </span>
              </div>
              {availableCharacters.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No characters yet. Create one from the Characters page, then come back to link it here.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableCharacters.map((character) => {
                    const selected = characterIds?.includes(character.id)
                    return (
                      <button
                        key={character.id}
                        type="button"
                        onClick={() => toggleCharacter(character.id)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all',
                          selected ? 'text-white border-transparent shadow-sm' : 'bg-background text-foreground border-border hover:border-violet-400'
                        )}
                        style={selected ? { backgroundColor: character.color_theme, borderColor: character.color_theme } : {}}
                      >
                        <span className="text-base leading-none">
                          {character.icon.type === 'emoji' ? character.icon.value : '👤'}
                        </span>
                        {character.title}
                        {selected && <Check className="w-3 h-3" />}
                      </button>
                    )
                  })}
                </div>
              )}
              {errors.character_ids && (
                <p className="text-xs text-destructive mt-1.5">{errors.character_ids.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1.5">
                Each character receives the full XP amount on completion.
              </p>
            </div>
          </FieldSet>

          {/* Rewards */}
          <FieldSet className="space-y-5">
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                {useCustomXp ? 'Custom Rewards' : 'Calculated Rewards'}
              </p>
              <div className="flex gap-3 flex-wrap">
                <RewardPill
                  icon={<Star className="w-4 h-4 text-amber-500" />}
                  label="Char. XP"
                  value={useCustomXp ? (watch('custom_character_xp') ?? 0) : algorithmRewards.character_xp}
                />
                <RewardPill
                  icon={<Zap className="w-4 h-4 text-violet-500" />}
                  label={`Skill XP${(skillIds?.length ?? 1) > 1 ? ' ea.' : ''}`}
                  value={useCustomXp ? (watch('custom_skill_xp') ?? 0) : perSkillXp}
                />
                <RewardPill
                  icon={<Coins className="w-4 h-4 text-yellow-500" />}
                  label="Gold"
                  value={useCustomXp ? (watch('gold_reward') ?? 0) : algorithmRewards.gold}
                />
                <RewardPill
                  icon={<Zap className="w-4 h-4 text-blue-500" />}
                  label="Energy"
                  value={`-${algorithmRewards.energy_cost}`}
                />
              </div>
              {(skillIds?.length ?? 0) > 1 && !useCustomXp && (
                <p className="text-xs text-muted-foreground mt-3">
                  Skill XP is split equally — {perSkillXp} XP × {skillIds?.length} skills.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Set custom rewards</p>
                <p className="text-xs text-muted-foreground">Override the calculated values</p>
              </div>
              <Controller
                name="use_custom_xp"
                control={control}
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>

            {useCustomXp && (
              <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="custom_char_xp" className="text-xs text-muted-foreground mb-1.5 block">
                      Char. XP
                    </Label>
                    <Controller
                      name="custom_character_xp"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="custom_char_xp"
                          type="number"
                          min={0}
                          value={field.value ?? algorithmRewards.character_xp}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom_skill_xp" className="text-xs text-muted-foreground mb-1.5 block">
                      Skill XP
                    </Label>
                    <Controller
                      name="custom_skill_xp"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="custom_skill_xp"
                          type="number"
                          min={0}
                          value={field.value ?? perSkillXp}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom_gold" className="text-xs text-muted-foreground mb-1.5 block">
                      Gold
                    </Label>
                    <Controller
                      name="gold_reward"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="custom_gold"
                          type="number"
                          min={0}
                          value={field.value ?? algorithmRewards.gold}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      )}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Skill XP is the per-skill amount. With {skillIds?.length ?? 1} skill
                  {(skillIds?.length ?? 1) > 1 ? 's' : ''} assigned, total Skill XP awarded per completion
                  will be {(watch('custom_skill_xp') ?? perSkillXp) * (skillIds?.length ?? 1)}.
                </p>
              </div>
            )}

            <div className="rounded-xl border bg-muted/20 px-4 py-3 flex items-center gap-3">
              <Repeat className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Recurrence</p>
                <p className="text-sm font-medium">
                  {getRecurrenceLabel(recurrence as HabitRecurrence, {
                    x_per_week_count: watch('x_per_week_count'),
                    weekly_day: watch('weekly_day'),
                    monthly_day: watch('monthly_day'),
                    custom_recurrence_config: watch('custom_recurrence_config') as HabitCustomRecurrenceConfig,
                  })}
                </p>
              </div>
            </div>
          </FieldSet>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-1.5 min-w-25">
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <span className="animate-spin">⟳</span> Saving…
                </span>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Save Changes
                </>
              )}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  )
}
