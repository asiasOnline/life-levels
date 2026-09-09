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
import { GoalDifficulty, GoalWithRelations, UpdateGoalInput } from '@/lib/types/goals'
import { updateGoal } from '@/lib/actions/goals'
import { calculateGoalRewards } from '@/lib/utils/goals'
import { cn } from '@/lib/utils/general'
import { toast } from 'sonner'
import { Check, Coins, Sparkles, Star, Target, Zap } from 'lucide-react'
import { FieldSet, FieldGroup, FieldLabel } from '@/components/ui/field'

// ===============================
// ZOD SCHEMA
// ===============================

const editGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  iconType: z.enum(['emoji', 'fontawesome', 'image']),
  iconColor: z.string().optional(),

  difficulty: z.enum(['easy', 'normal', 'hard', 'expert']),
  start_date: z.string().optional(),
  due_date: z.string().optional(),

  skill_ids: z.array(z.string()).max(3, 'Max 3 skills'),
  character_ids: z.array(z.string()).max(3, 'Max 3 characters'),

  use_custom_xp: z.boolean(),
  custom_character_xp: z.number().min(0).optional(),
  custom_skill_xp: z.number().int().min(0).optional(),
  gold_reward: z.number().min(0).optional(),
}).refine(
  (data) => {
    if (data.start_date && data.due_date) {
      return new Date(data.start_date) <= new Date(data.due_date)
    }
    return true
  },
  {
    message: 'Due date must be after start date',
    path: ['due_date'],
  }
)

type EditGoalFormValues = z.infer<typeof editGoalSchema>

// ================================
// PROPS
// ================================
interface EditGoalModalProps {
  isOpen: boolean
  onClose: () => void
  onGoalUpdated: () => void
  goal: GoalWithRelations | null
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

function toDateInputValue(value: unknown): string {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value as string)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

// ===============================
// MAIN COMPONENT
// ===============================

export function EditGoalModal({
  isOpen,
  onClose,
  onGoalUpdated,
  goal,
  availableSkills,
  availableCharacters,
}: EditGoalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EditGoalFormValues>({
    resolver: zodResolver(editGoalSchema),
    defaultValues: {
      title: '',
      description: '',
      icon: '🎯',
      iconType: 'emoji',
      difficulty: 'normal',
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

  // Re-populate the form whenever a different goal is opened for editing
  useEffect(() => {
    if (goal && isOpen) {
      const icon = goal.icon as IconData
      reset({
        title: goal.title,
        description: goal.description ?? '',
        icon: icon.value,
        iconType: icon.type as 'emoji' | 'fontawesome' | 'image',
        iconColor: icon.color,
        difficulty: goal.difficulty,
        start_date: toDateInputValue(goal.start_date),
        due_date: toDateInputValue(goal.due_date),
        skill_ids: goal.skills.map((s) => s.id),
        character_ids: goal.characters.map((c) => c.id),
        use_custom_xp: goal.use_custom_xp,
        custom_character_xp: goal.character_xp,
        custom_skill_xp: goal.skill_xp,
        gold_reward: undefined,
      })
    }
  }, [goal, isOpen, reset])

  const difficulty = watch('difficulty')
  const useCustomXp = watch('use_custom_xp')
  const skillIds = watch('skill_ids')
  const characterIds = watch('character_ids')

  const algorithmRewards = calculateGoalRewards(
    difficulty as GoalDifficulty,
    Math.max(1, skillIds?.length ?? 1)
  )

  const onSubmit = async (values: EditGoalFormValues) => {
    if (!goal) return
    setIsSubmitting(true)
    try {
      const input: UpdateGoalInput = {
        id: goal.id,
        title: values.title,
        icon: values.icon || '🎯',
        icon_type: values.iconType,
        icon_color: values.iconColor,
        description: values.description || null,
        difficulty: values.difficulty as GoalDifficulty,
        start_date: values.start_date || null,
        due_date: values.due_date || null,
        skill_ids: values.skill_ids,
        character_ids: values.character_ids,
        use_custom_xp: values.use_custom_xp,
      }

      if (values.use_custom_xp) {
        input.character_xp = values.custom_character_xp
        input.skill_xp = values.custom_skill_xp
        input.gold_reward = values.gold_reward
      }

      const result = await updateGoal(input)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(`"${values.title}" has been updated.`)
      onGoalUpdated()
      onClose()
    } catch (error) {
      console.error('Error updating goal:', error)
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

  const handleIconChange = (icon: string, iconType: IconType, iconColor?: string) => {
    form.setValue('icon', icon)
    form.setValue('iconType', iconType as 'emoji' | 'fontawesome' | 'image')
    if (iconColor) {
      form.setValue('iconColor', iconColor)
    }
  }

  if (!goal) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Goal</DialogTitle>
          <DialogDescription>
            Update this goal&apos;s details, or link skills and characters to it now
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Basics */}
          <FieldSet className="space-y-5 gap-4">
            <div className="flex items-start gap-3">
              <FieldGroup className="flex-1 min-w-12">
                <IconPicker
                  currentIcon={form.watch('icon') || '🎯'}
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
                  placeholder="e.g. Run a 10K, Learn Spanish…"
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
                placeholder="What does achieving this goal look like?"
                rows={3}
                {...register('description')}
                className="resize-none"
              />
            </div>
          </FieldSet>

          {/* Details */}
          <FieldSet className="space-y-5">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Difficulty <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="difficulty"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="How hard is this goal?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date" className="text-xs text-muted-foreground mb-1.5 block">
                  Start date
                </Label>
                <Input id="start_date" type="date" {...register('start_date')} />
              </div>
              <div>
                <Label htmlFor="due_date" className="text-xs text-muted-foreground mb-1.5 block">
                  Due date
                </Label>
                <Input
                  id="due_date"
                  type="date"
                  {...register('due_date')}
                  className={cn(errors.due_date && 'border-destructive')}
                />
                {errors.due_date && <p className="text-xs text-destructive mt-1">{errors.due_date.message}</p>}
              </div>
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
                  value={useCustomXp ? (watch('custom_skill_xp') ?? 0) : algorithmRewards.skill_xp}
                />
                <RewardPill
                  icon={<Coins className="w-4 h-4 text-yellow-500" />}
                  label="Gold"
                  value={useCustomXp ? (watch('gold_reward') ?? 0) : algorithmRewards.gold}
                />
              </div>
              {(skillIds?.length ?? 0) > 1 && !useCustomXp && (
                <p className="text-xs text-muted-foreground mt-3">
                  Skill XP is split equally — {algorithmRewards.skill_xp} XP × {skillIds?.length} skills.
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
                          value={field.value ?? algorithmRewards.skill_xp}
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
                  {(skillIds?.length ?? 1) > 1 ? 's' : ''} assigned, total Skill XP awarded on completion
                  will be {(watch('custom_skill_xp') ?? algorithmRewards.skill_xp) * (skillIds?.length ?? 1)}.
                </p>
              </div>
            )}

            <div className="rounded-xl border bg-muted/20 px-4 py-3 flex items-center gap-3">
              <Target className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Difficulty</p>
                <p className="text-sm font-medium capitalize">{difficulty}</p>
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
