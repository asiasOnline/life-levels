'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  IconType,
  IconData,
} from "@/lib/types/icon"
import { SkillSummary } from '@/lib/types/skills'
import { CharacterSummary } from '@/lib/types/character'
import {
  GoalDifficulty,
  CreateGoalInput,
} from '@/lib/types/goals'
import { createGoal } from '@/lib/actions/goals'
import { calculateGoalRewards } from '@/lib/utils/goals'
import { cn } from '@/lib/utils/general'
import { renderIcon } from '@/lib/utils/icon'
import { toast } from 'sonner'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  Sparkles,
  Star,
  Target,
  Zap,
} from 'lucide-react'
import {
    FieldSet,
    FieldGroup,
    FieldLabel
} from '@/components/ui/field'

// ==========================================
// CONSTANTS
// ==========================================

const DEFAULT_ICON: IconData = { type: 'emoji', value: '🎯' }

const STEPS = [
  { id: 1, label: 'Basics'  },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Assign'  },
  { id: 4, label: 'Rewards' },
  { id: 5, label: 'Review'  },
] as const

// ===============================
// ZOD SCHEMA
// ===============================

const createGoalSchema = z.object({
  // STEP 1
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title is too long'),
  description: z
    .string()
    .max(500)
    .optional(),
  icon: z
    .string()
    .optional(),
  iconType: z
    .enum(['emoji', 'fontawesome', 'image']),
  iconColor: z
    .string()
    .optional(),

  // STEP 2
  difficulty: z
    .enum(['easy', 'normal', 'hard', 'expert']),
  start_date: z
    .string()
    .optional(),
  due_date: z
    .string()
    .optional(),

  // STEP 3
  skill_ids: z
    .array(z.string())
    .max(3, 'Max 3 skills'),
  character_ids: z
    .array(z.string())
    .max(3, 'Max 3 characters'),

  // STEP 4
  use_custom_xp: z
    .boolean(),
  custom_character_xp: z
    .number()
    .min(0)
    .optional(),
  custom_skill_xp: z
    .number()
    .int()
    .min(0)
    .optional(),
  gold_reward: z
    .number()
    .min(0)
    .optional(),
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

type CreateGoalFormValues = z.infer<typeof createGoalSchema>

// ================================
// PROPS
// ================================
interface CreateGoalModalProps {
  isOpen: boolean
  onClose: () => void
  onGoalCreated: () => void
  availableSkills: SkillSummary[]
  availableCharacters: CharacterSummary[]
}

// ================================
// HELPERS
// ================================

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center gap-2">
          <div
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors',
              current === step.id
                ? 'bg-violet-600 text-white'
                : current > step.id
                ? 'bg-violet-200 text-violet-700'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {current > step.id ? <Check className="w-3.5 h-3.5" /> : step.id}
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn('w-6 h-px', current > step.id ? 'bg-violet-300' : 'bg-border')} />
          )}
        </div>
      ))}
    </div>
  )
}

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

export function CreateGoalModal({
  isOpen,
  onClose,
  onGoalCreated,
  availableSkills,
  availableCharacters,
}: CreateGoalModalProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateGoalFormValues>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      title:         '',
      description:   '',
      icon:          DEFAULT_ICON.value,
      iconType:      DEFAULT_ICON.type as 'emoji' | 'fontawesome' | 'image',
      iconColor:     undefined,
      difficulty:    'normal',
      skill_ids:     [],
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
    trigger,
    formState: { errors },
    reset,
  } = form

  // ── Watched values for conditional rendering ────────────────────────────
  const difficulty = watch('difficulty')
  const useCustomXp = watch('use_custom_xp')
  const skillIds = watch('skill_ids')
  const characterIds = watch('character_ids')

  // ── Algorithm preview ──────────────────────────────────────────────────
  const algorithmRewards = calculateGoalRewards(
    difficulty as GoalDifficulty,
    Math.max(1, skillIds?.length ?? 1)
  )

  // ── Reset on close ───────────────────────
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        reset()
        setStep(1)
      }, 200)
    }
  }, [isOpen, reset])

  // ── Step validation before advancing ──────
  const validateStep = useCallback(async (s: number): Promise<boolean> => {
    if (s === 1) return trigger(['title'])
    if (s === 2) return trigger(['difficulty', 'start_date', 'due_date'])
    if (s === 3) return trigger(['skill_ids', 'character_ids'])
    return true
  }, [trigger])

  const advance = async () => {
    const valid = await validateStep(step)
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length))
  }
  const retreat = () => setStep((s) => Math.max(s - 1, 1))

  // ── Submit ────────────────────────────────
  const onSubmit = async (values: CreateGoalFormValues) => {
    setIsSubmitting(true)
    try {
      const input: CreateGoalInput = {
        title:        values.title,
        icon:         values.icon || DEFAULT_ICON.value,
        icon_type:    values.iconType,
        icon_color:   values.iconColor,
        description:  values.description || undefined,
        difficulty:   values.difficulty as GoalDifficulty,
        start_date:   values.start_date || undefined,
        due_date:     values.due_date || undefined,
        skill_ids:     values.skill_ids,
        character_ids: values.character_ids,
        use_custom_xp: values.use_custom_xp,
      }

      if (values.use_custom_xp) {
        input.character_xp = values.custom_character_xp
        input.skill_xp     = values.custom_skill_xp
        input.gold_reward  = values.gold_reward
      }

      const result = await createGoal(input)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(`"${values.title}" goal created!`)
      onGoalCreated()
      onClose()
    } catch (error) {
      console.error('Error creating goal:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Toggle helpers ────────────────────────
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

  // ===================================
  // RENDER
  // ===================================

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">New Goal</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* ============================
              STEP 1 — BASICS
          ================================ */}
          {step === 1 && (
            <FieldSet className="space-y-5 gap-4">

              <div className="flex items-start gap-3">
                {/* Icon */}
                <FieldGroup className='flex-1 min-w-12'>
                  <IconPicker
                    currentIcon={form.watch('icon') || DEFAULT_ICON.value}
                    currentIconType={form.watch('iconType') as IconType}
                    currentIconColor={form.watch('iconColor')}
                    onIconChange={handleIconChange}
                  />
                 </FieldGroup>

                {/* Title */}
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
                  {errors.title && (
                    <p className="text-xs text-destructive">{errors.title.message}</p>
                  )}
                </FieldGroup>
              </div>

              {/* Description */}
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
          )}

          {/* =================================
              STEP 2 — DETAILS
          ==============================*/}
          {step === 2 && (
            <FieldSet className="space-y-5">

              {/* Difficulty */}
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

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date" className="text-xs text-muted-foreground mb-1.5 block">
                    Start date
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    {...register('start_date')}
                  />
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
                  {errors.due_date && (
                    <p className="text-xs text-destructive mt-1">{errors.due_date.message}</p>
                  )}
                </div>
              </div>
            </FieldSet>
          )}

          {/* ================================
              STEP 3 — ASSIGN
          ================================*/}
          {step === 3 && (
            <FieldSet className="space-y-6">

              {/* Skills */}
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
                  <p className="text-sm text-muted-foreground italic">No skills yet. You can create one later and link it from this goal.</p>
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
                {errors.skill_ids && (
                  <p className="text-xs text-destructive mt-1.5">{errors.skill_ids.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  XP is split equally across all assigned skills.
                </p>
              </div>

              {/* Characters */}
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
                  <p className="text-sm text-muted-foreground italic">No characters yet. You can create one later and link it from this goal.</p>
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
                            selected
                              ? 'text-white border-transparent shadow-sm'
                              : 'bg-background text-foreground border-border hover:border-violet-400'
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
          )}

          {/* ================================
              STEP 4 — REWARDS
          ================================= */}
          {step === 4 && (
            <FieldSet className="space-y-5">

              {/* Algorithm preview */}
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

              {/* Custom override toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Set custom rewards</p>
                  <p className="text-xs text-muted-foreground">Override the calculated values</p>
                </div>
                <Controller
                  name="use_custom_xp"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              {/* Custom fields */}
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

            </FieldSet>
          )}

          {/* ================================
              STEP 5 — REVIEW
          ================================= */}
          {step === 5 && (
            <FieldSet className="space-y-5">

              {/* Basics summary */}
              <div className="rounded-xl border bg-muted/20 p-4 flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-background border text-lg shrink-0">
                  {renderIcon(watch('icon'), watch('iconType'), watch('iconColor'), 'w-5 h-5')}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{watch('title')}</p>
                  {watch('description') && (
                    <p className="text-sm text-muted-foreground mt-0.5">{watch('description')}</p>
                  )}
                </div>
              </div>

              {/* Difficulty & dates summary */}
              <div className="rounded-xl border bg-muted/20 px-4 py-3 flex items-center gap-3">
                <Target className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Difficulty</p>
                  <p className="text-sm font-medium capitalize">
                    {difficulty}
                    {(watch('start_date') || watch('due_date')) && ' · '}
                    {watch('start_date') && `Starts ${watch('start_date')}`}
                    {watch('start_date') && watch('due_date') && ' — '}
                    {watch('due_date') && `Due ${watch('due_date')}`}
                  </p>
                </div>
              </div>

              {/* Skills & characters summary */}
              {((skillIds?.length ?? 0) > 0 || (characterIds?.length ?? 0) > 0) && (
                <div className="space-y-3">
                  {(skillIds?.length ?? 0) > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Skills</Label>
                      <div className="flex flex-wrap gap-2">
                        {availableSkills.filter((s) => skillIds.includes(s.id)).map((skill) => (
                          <span
                            key={skill.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-muted/40 text-sm font-medium"
                          >
                            <span className="text-base leading-none">
                              {skill.icon.type === 'emoji' ? skill.icon.value : '⚡'}
                            </span>
                            {skill.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(characterIds?.length ?? 0) > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Characters</Label>
                      <div className="flex flex-wrap gap-2">
                        {availableCharacters.filter((c) => characterIds.includes(c.id)).map((character) => (
                          <span
                            key={character.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-white text-sm font-medium"
                            style={{ backgroundColor: character.color_theme, borderColor: character.color_theme }}
                          >
                            <span className="text-base leading-none">
                              {character.icon.type === 'emoji' ? character.icon.value : '👤'}
                            </span>
                            {character.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Rewards summary */}
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                  Rewards
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
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Review the details above, then create your goal.
              </p>
            </FieldSet>
          )}

          {/* =================================
              NAVIGATION
          ================================= */}

          <div className="space-y-3 pt-2 border-t">

            <StepIndicator current={step} />

            <div className="flex items-center justify-between">
              {step > 1 ? (
                <Button type="button" variant="ghost" onClick={retreat} className="gap-1.5">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
              )}

              {step < STEPS.length ? (
                <Button type="button" onClick={advance} className="gap-1.5">
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="gap-1.5 min-w-25">
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <span className="animate-spin">⟳</span> Creating…
                    </span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Create Goal
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  )
}
