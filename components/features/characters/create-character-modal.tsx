'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldSet,
} from '@/components/ui/field'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs'
import { IconPicker } from '@/components/layout/app/icon-picker'
import {
  ColorPicker,
  COLOR_PALETTE,
  HEX_COLOR_REGEX,
} from '@/components/layout/app/color-picker'
import {
  IconType,
  IconData,
} from "@/lib/types/icon"
import { AVATAR_REGISTRY } from './avatars/avatar-registry'
import { AvatarRenderer } from './avatars/avatar-renderer'
import { CreateCharacterInput } from '@/lib/types/character'
import { SkillSummary } from '@/lib/types/skills'
import { createCharacter } from '@/lib/actions/characters'
import { cn } from '@/lib/utils/general'
import { renderIcon } from '@/lib/utils/icon'
import { toast } from "sonner"
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'

// =======================================
// CONSTANTS
// =======================================

const DEFAULT_ICON: IconData = {
  type: 'fontawesome',
  value: 'HiOutlineUserGroup',
  color: '#525252'
}

const DEFAULT_AVATAR_COLOR = '#1f2937'

const STEPS = [
  { id: 1, label: 'Basics'     },
  { id: 2, label: 'Appearance' },
  { id: 3, label: 'Link'       },
  { id: 4, label: 'Review'     },
] as const

// =======================================
// ZOD SCHEMA
// =======================================

const createCharacterSchema = z.object({
  // STEP 1 - Basics
  title: z
    .string()
    .min(1, 'Title is required')
    .max(50, 'Title must be 50 characters or fewer'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or fewer')
    .optional(),
  character_quote: z
    .string()
    .max(500, 'Quote must be 1000 characters or fewer')
    .optional(),
  icon: z
    .string()
    .optional(),
  iconType: z
    .enum(['emoji', 'fontawesome', 'image']),
  iconColor: z
    .string()
    .optional(),

  // STEP 2 - Appearance
  avatar: z
    .string()
    .nullable(),
  avatar_color: z
    .string()
    .regex(HEX_COLOR_REGEX, 'Please select an avatar color'),
  character_color: z
    .string()
    .regex(HEX_COLOR_REGEX, 'Please select a background color'),

  // STEP 3 - Link
  skillIds: z.array(z.string()),
  habitIds: z.array(z.string()),
  taskIds:  z.array(z.string()),
  goalIds:  z.array(z.string()),
})

type CreateCharacterFormValues = z.infer<typeof createCharacterSchema>
type LinkField = 'skillIds' | 'habitIds' | 'taskIds' | 'goalIds'

// =======================================
// PROPS
// =======================================

// Minimal shape shared by everything a character can be linked to
export type LinkableItem = {
  id: string
  title: string
  icon: IconData
}

interface CreateCharacterModalProps {
  isOpen: boolean
  onClose: (open: boolean) => void
  onCharacterCreated?: () => void
  characterLevel?: number // defaults to 1 for creation
  availableSkills?: SkillSummary[]
  availableHabits?: LinkableItem[]
  availableTasks?: LinkableItem[]
  availableGoals?: LinkableItem[]
}

// =======================================
// HELPERS
// =======================================

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
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

interface AvatarPreviewProps {
  avatar: string | null
  avatarColor: string
  backgroundColor: string
  size?: number
}

function AvatarPreview({ avatar, avatarColor, backgroundColor, size = 96 }: AvatarPreviewProps) {
  return (
    <div
      className="rounded-xl flex items-center justify-center shadow-sm border overflow-hidden shrink-0 transition-colors"
      style={{
        width: size,
        height: size,
        backgroundColor: backgroundColor + '22',
        borderColor: backgroundColor + '66',
      }}
    >
      {avatar ? (
        <AvatarRenderer
          archetypeId={avatar}
          color={avatarColor}
          size={size - 8}
        />
      ) : (
        <span className="text-xs text-muted-foreground">No avatar</span>
      )}
    </div>
  )
}

interface LinkSectionProps {
  label: string
  items: LinkableItem[]
  selectedIds: string[]
  onToggle: (id: string) => void
  emptyText: string
  renderMeta?: (item: LinkableItem) => React.ReactNode
}

function LinkSection({
  label,
  items,
  selectedIds,
  onToggle,
  emptyText,
  renderMeta
}: LinkSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label className="text-xs text-muted-foreground">
          {label} <span className="text-muted-foreground">(optional)</span>
        </Label>
        <span className="text-xs tabular-nums text-muted-foreground">
          {selectedIds.length} selected
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {items.map((item) => {
            const selected = selectedIds.includes(item.id)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggle(item.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all',
                  selected
                    ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                    : 'bg-background text-foreground border-border hover:border-violet-400'
                )}
              >
                {renderIcon(item.icon.value, item.icon.type, selected ? '#ffffff' : item.icon.color, 'w-4 h-4')}
                <span className="truncate max-w-40">{item.title}</span>
                {renderMeta?.(item)}
                {selected && <Check className="w-3 h-3" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// =======================================
// MAIN COMPONENT
// =======================================

export function CreateCharacterModal({
  isOpen,
  onClose,
  onCharacterCreated,
  characterLevel = 1,
  availableSkills = [],
  availableHabits = [],
  availableTasks = [],
  availableGoals = [],
}: CreateCharacterModalProps) {
  const [step, setStep] = useState(1)
  const [appearanceTab, setAppearanceTab] = useState<'avatar' | 'background'>('avatar')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<CreateCharacterFormValues>({
    resolver: zodResolver(createCharacterSchema),
    defaultValues: {
      title: '',
      description: '',
      icon: DEFAULT_ICON.value,
      iconType: DEFAULT_ICON.type as 'emoji' | 'fontawesome' | 'image',
      iconColor: DEFAULT_ICON.color,
      avatar: null,
      avatar_color: DEFAULT_AVATAR_COLOR,
      character_color: COLOR_PALETTE[0].hex,
      skillIds: [],
      habitIds: [],
      taskIds: [],
      goalIds: [],
    },
  })

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = form

  const avatar = watch('avatar')
  const avatarColor = watch('avatar_color')
  const backgroundColor = watch('character_color')
  const selectedIds: Record<LinkField, string[]> = {
    skillIds: watch('skillIds'),
    habitIds: watch('habitIds'),
    taskIds:  watch('taskIds'),
    goalIds:  watch('goalIds'),
  }

  function handleClose() {
    form.reset()
    setStep(1)
    setAppearanceTab('avatar')
    setSubmitError(null)
    onClose(false)
  }

  const handleIconChange = (icon: string, icon_type: IconType, icon_color?: string) => {
    setValue('icon', icon)
    setValue('iconType', icon_type)
    if (icon_color) {
      setValue('iconColor', icon_color)
    }
  }

  function toggleLink(field: LinkField, id: string) {
    const current = form.getValues(field)
    setValue(
      field,
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    )
  }

  // ── Step validation before advancing ──────
  const validateStep = useCallback(async (s: number): Promise<boolean> => {
    if (s === 1) return trigger(['title', 'description'])
    if (s === 2) return trigger(['avatar_color', 'character_color'])
    return true
  }, [trigger])

  const advance = async () => {
    const valid = await validateStep(step)
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length))
  }
  const retreat = () => setStep((s) => Math.max(s - 1, 1))

  async function onSubmit(values: CreateCharacterFormValues) {
    // Enter inside a text field submits the form — treat it as "Next" until the last step
    if (step < STEPS.length) {
      await advance()
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const input: CreateCharacterInput = {
        title: values.title,
        character_color: values.character_color,
        icon: values.icon || DEFAULT_ICON.value,
        icon_type: values.iconType,
        icon_color: values.iconColor,
        description: values.description || undefined,
        avatar: values.avatar,
        avatar_color: values.avatar_color,
        skill_ids: values.skillIds,
        habit_ids: values.habitIds,
        task_ids: values.taskIds,
        goal_ids: values.goalIds,
      }

      const result = await createCharacter(input)

      if (!result.success) {
        if (result.error.includes('title')) {
          form.setError('title', { message: result.error })
          setStep(1)
        } else if (result.error.includes('color')) {
          form.setError('character_color', { message: result.error })
          setAppearanceTab('background')
          setStep(2)
        } else {
          setSubmitError(result.error)
        }
        return
      }

      toast.success(`"${values.title}" character created!`)
      handleClose()
      onCharacterCreated?.()
    } catch (error: unknown) {
      console.error('Failed to create character:', error)
      const { code, message } = (error ?? {}) as { code?: string; message?: string }

      if (code === '23505') {
        // Unique violation — could be title or color_theme
        if (message?.includes('unique_character_title_per_user')) {
          setSubmitError('You already have a character with this title. Please choose a different name.')
        } else if (message?.includes('unique_color_theme_per_user')) {
          setSubmitError('You already have a character using this color. Please choose a different one.')
        } else {
          setSubmitError('A character with this title or color already exists.')
        }
      } else {
        setSubmitError('Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const linkedSkills = availableSkills.filter((s) => selectedIds.skillIds.includes(s.id))
  const linkedHabits = availableHabits.filter((h) => selectedIds.habitIds.includes(h.id))
  const linkedTasks  = availableTasks.filter((t) => selectedIds.taskIds.includes(t.id))
  const linkedGoals  = availableGoals.filter((g) => selectedIds.goalIds.includes(g.id))
  const hasLinks = linkedSkills.length + linkedHabits.length + linkedTasks.length + linkedGoals.length > 0

// =======================================
// COMPONENT RENDER
// =======================================

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">New Character</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Step {step} of {STEPS.length} · {STEPS[step - 1].label}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* ============================
              STEP 1 — BASICS
          ================================ */}
          {step === 1 && (
            <FieldSet className="space-y-5 gap-4">
              <div className="flex items-end gap-3">
                {/* Icon */}
                <Field className='flex-1 min-w-12'>
                  <IconPicker
                    currentIcon={watch('icon')}
                    currentIconType={watch('iconType')}
                    currentIconColor={watch('iconColor')}
                    onIconChange={handleIconChange}
                  />
                </Field>

                {/* Title */}
                <Field className="min-w-0 gap-2">
                  <FieldLabel htmlFor="title">
                    Character Name<span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="title"
                    placeholder="e.g. Work Self, The Athlete, Aphrodite"
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </Field>
              </div>

              {/* Description */}
              <Field className="space-y-2">
                <FieldLabel htmlFor="description">
                  Description{' '}
                  <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                </FieldLabel>
                <Textarea
                  id="description"
                  placeholder="What does this character represent? What life context does it cover?"
                  rows={3}
                  className="resize-none"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </Field>
            </FieldSet>
          )}

          {/* ============================
              STEP 2 — APPEARANCE
          ================================ */}
          {step === 2 && (
            <FieldSet className="space-y-5 gap-4">

              {/* Live preview */}
              <div className="flex items-center gap-4 rounded-xl border bg-muted/30 p-4">
                <AvatarPreview
                  avatar={avatar}
                  avatarColor={avatarColor}
                  backgroundColor={backgroundColor}
                />
                <div className="min-w-0 space-y-1 text-sm">
                  <p className="font-medium truncate">
                    {AVATAR_REGISTRY.find((a) => a.id === avatar)?.label ?? 'No avatar selected'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You can skip the avatar and add one later.
                  </p>
                </div>
              </div>

              <Tabs
                value={appearanceTab}
                onValueChange={(v) => setAppearanceTab(v as 'avatar' | 'background')}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="avatar" className="flex-1">Avatar</TabsTrigger>
                  <TabsTrigger value="background" className="flex-1">Background</TabsTrigger>
                </TabsList>

                {/* ─── AVATAR TAB ─────────────────────────────────── */}
                <TabsContent value="avatar" className="space-y-5 pt-2">
                  <div className="grid grid-cols-4 gap-2">
                    {AVATAR_REGISTRY.map((archetype) => {
                      const isLocked = archetype.lockedUntilLevel
                        ? characterLevel < archetype.lockedUntilLevel
                        : false
                      const isSelected = avatar === archetype.id

                      return (
                        <button
                          key={archetype.id}
                          type="button"
                          disabled={isLocked}
                          onClick={() => setValue('avatar', isSelected ? null : archetype.id)}
                          className={cn(
                            'relative flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-xs overflow-hidden',
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-muted-foreground/40 hover:bg-muted/40',
                            isLocked && 'opacity-40 cursor-not-allowed hover:border-border hover:bg-transparent'
                          )}
                        >
                          <AvatarRenderer
                            archetypeId={archetype.id}
                            color={avatarColor}
                            size={56}
                          />
                          <span className="font-medium text-foreground">{archetype.label}</span>
                          {isLocked && (
                            <span className="absolute top-1 right-1 text-[10px] text-muted-foreground">
                              Lv{archetype.lockedUntilLevel}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <div className="space-y-2">
                    <Label>Avatar Color</Label>
                    <ColorPicker
                      value={avatarColor}
                      onChange={(hex) => setValue('avatar_color', hex, { shouldValidate: true })}
                    />
                    {errors.avatar_color && (
                      <p className="text-sm text-destructive">{errors.avatar_color.message}</p>
                    )}
                  </div>
                </TabsContent>

                {/* ─── BACKGROUND TAB ─────────────────────────────── */}
                <TabsContent value="background" className="space-y-3 pt-2">
                  <Label>
                    Background Color<span className="text-destructive">*</span>
                  </Label>
                  <ColorPicker
                    value={backgroundColor}
                    onChange={(hex) => setValue('character_color', hex, { shouldValidate: true })}
                  />
                  {errors.character_color && (
                    <p className="text-sm text-destructive">{errors.character_color.message}</p>
                  )}
                </TabsContent>
              </Tabs>
            </FieldSet>
          )}

          {/* ============================
              STEP 3 — LINK
          ================================ */}
          {step === 3 && (
            <FieldSet className="space-y-6">
              <FieldDescription>
                Link existing items to this character. You can also link them later.
              </FieldDescription>

              <LinkSection
                label="Skills"
                items={availableSkills}
                selectedIds={selectedIds.skillIds}
                onToggle={(id) => toggleLink('skillIds', id)}
                emptyText="No skills yet. You can create one later and link it to this character."
                renderMeta={(item) => (
                  <Badge variant="outline" className="text-xs">
                    Lv {availableSkills.find((s) => s.id === item.id)?.level}
                  </Badge>
                )}
              />
              <LinkSection
                label="Habits"
                items={availableHabits}
                selectedIds={selectedIds.habitIds}
                onToggle={(id) => toggleLink('habitIds', id)}
                emptyText="No habits yet. You can create one later and link it to this character."
              />
              <LinkSection
                label="Tasks"
                items={availableTasks}
                selectedIds={selectedIds.taskIds}
                onToggle={(id) => toggleLink('taskIds', id)}
                emptyText="No tasks yet. You can create one later and link it to this character."
              />
              <LinkSection
                label="Goals"
                items={availableGoals}
                selectedIds={selectedIds.goalIds}
                onToggle={(id) => toggleLink('goalIds', id)}
                emptyText="No goals yet. You can create one later and link it to this character."
              />
            </FieldSet>
          )}

          {/* ============================
              STEP 4 — REVIEW
          ================================ */}
          {step === 4 && (
            <FieldSet className="space-y-5">

              {/* Basics + appearance summary */}
              <div className="rounded-xl border bg-muted/20 p-4 flex items-start gap-4">
                <AvatarPreview
                  avatar={avatar}
                  avatarColor={avatarColor}
                  backgroundColor={backgroundColor}
                  size={80}
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    {renderIcon(watch('icon'), watch('iconType'), watch('iconColor'), 'w-5 h-5')}
                    <p className="font-semibold truncate">{watch('title')}</p>
                  </div>
                  {watch('description') && (
                    <p className="text-sm text-muted-foreground">{watch('description')}</p>
                  )}
                  <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full border border-border/50"
                        style={{ backgroundColor }}
                      />
                      Background
                    </span>
                    {avatar && (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full border border-border/50"
                          style={{ backgroundColor: avatarColor }}
                        />
                        Avatar
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Linked items summary */}
              {hasLinks ? (
                <div className="space-y-3">
                  {([
                    ['Skills', linkedSkills],
                    ['Habits', linkedHabits],
                    ['Tasks',  linkedTasks],
                    ['Goals',  linkedGoals],
                  ] as [string, LinkableItem[]][])
                    .filter(([, items]) => items.length > 0)
                    .map(([label, items]) => (
                      <div key={label}>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
                        <div className="flex flex-wrap gap-2">
                          {items.map((item) => (
                            <span
                              key={item.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-muted/40 text-sm font-medium"
                            >
                              {renderIcon(item.icon.value, item.icon.type, item.icon.color, 'w-4 h-4')}
                              {item.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nothing linked yet — you can link skills, habits, tasks and goals any time.
                </p>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Review the details above, then create your character.
              </p>
            </FieldSet>
          )}

          {/* Error message */}
          {submitError && (
            <p className="text-sm text-destructive text-center">{submitError}</p>
          )}

          {/* =================================
              NAVIGATION
          ================================= */}
          <div className="space-y-3 pt-2 border-t">
            <StepIndicator current={step} />

            <div className="flex items-center justify-between">
              {step > 1 ? (
                <Button type="button" variant="ghost" onClick={retreat} disabled={isSubmitting} className="gap-1.5">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={handleClose}>
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
                      <Check className="w-4 h-4" /> Create Character
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
