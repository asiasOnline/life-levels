'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { IconPicker } from '@/components/layout/app/icon-picker'
import {
  IconType,
  DEFAULT_ICON,
  DEFAULT_ICON_TYPE,
  DEFAULT_ICON_COLOR,
} from '@/lib/types/icon'
import { toast } from 'sonner'
import {
  TASK_PRIORITY,
  TASK_DIFFICULTY,
  TASK_PRIORITY_LABELS,
  TASK_DIFFICULTY_LABELS,
  TaskWithRelations,
  UpdateTaskInput,
} from '@/lib/types/tasks'
import { getDefaultGoldReward, calculateTaskXP } from '@/lib/utils/tasks'
import { updateTask } from '@/lib/actions/tasks'
import { SkillSummary } from '@/lib/types/skills'
import { CharacterSummary } from '@/lib/types/character'
import { FaCoins, FaCircleArrowUp, FaUserGroup } from 'react-icons/fa6'
import { cn } from '@/lib/utils/general'

// ==========================================
// ZOD SCHEMA
// ==========================================

const editTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  icon: z.string().optional(),
  iconType: z.enum(['emoji', 'fontawesome', 'image']),
  iconColor: z.string().optional(),

  priority: z.enum(['critical', 'high', 'mid', 'low']),
  difficulty: z.enum(['easy', 'normal', 'hard', 'expert']),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),

  skillIds: z.array(z.string()).max(3, 'Maximum 3 skills allowed'),
  characterIds: z.array(z.string()).max(3, 'Maximum 3 characters allowed'),
  goldReward: z.number().min(0).optional(),
  useCustomXP: z.boolean(),
  characterXP: z.number().min(0).optional(),
  skillXP: z.number().min(0).optional(),
}).refine(
  (data) => {
    if (data.startDate && data.dueDate) {
      return new Date(data.startDate) <= new Date(data.dueDate)
    }
    return true
  },
  {
    message: 'Due date must be after start date',
    path: ['dueDate'],
  }
)

type EditTaskFormValues = z.infer<typeof editTaskSchema>

// ================================
// PROPS
// ================================

interface EditTaskModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated: () => void
  task: TaskWithRelations | null
  availableSkills: SkillSummary[]
  availableCharacters: CharacterSummary[]
}

// ================================
// HELPERS
// ================================

function toDateInputValue(value: unknown): string {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value as string)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

// ===============================
// MAIN COMPONENT
// ===============================

export function EditTaskModal({
  isOpen,
  onOpenChange,
  onTaskUpdated,
  task,
  availableSkills,
  availableCharacters,
}: EditTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EditTaskFormValues>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      icon: DEFAULT_ICON,
      iconType: DEFAULT_ICON_TYPE as 'emoji' | 'fontawesome' | 'image',
      iconColor: DEFAULT_ICON_COLOR,
      priority: TASK_PRIORITY.MID,
      difficulty: TASK_DIFFICULTY.NORMAL,
      startDate: '',
      dueDate: '',
      skillIds: [],
      characterIds: [],
      goldReward: undefined,
      useCustomXP: false,
      characterXP: undefined,
      skillXP: undefined,
    },
  })

  // Re-populate the form whenever a different task is opened for editing
  useEffect(() => {
    if (task && isOpen) {
      form.reset({
        title: task.title,
        description: task.description ?? '',
        icon: task.icon.value,
        iconType: task.icon.type as 'emoji' | 'fontawesome' | 'image',
        iconColor: task.icon.color ?? DEFAULT_ICON_COLOR,
        priority: task.priority,
        difficulty: task.difficulty,
        startDate: toDateInputValue(task.start_date),
        dueDate: toDateInputValue(task.due_date),
        skillIds: task.skills.map((s) => s.id),
        characterIds: task.characters.map((c) => c.id),
        goldReward: task.gold_reward,
        useCustomXP: task.use_custom_xp,
        characterXP: task.character_xp,
        skillXP: task.skill_xp,
      })
    }
  }, [task, isOpen, form])

  const watchedDifficulty = form.watch('difficulty')
  const watchedSkillIds = form.watch('skillIds')
  const watchedCharacterIds = form.watch('characterIds')
  const watchedUseCustomXP = form.watch('useCustomXP')
  const watchedCustomCharacterXP = form.watch('characterXP')
  const watchedCustomSkillXP = form.watch('skillXP')

  const handleIconChange = (icon: string, iconType: IconType, iconColor?: string) => {
    form.setValue('icon', icon)
    form.setValue('iconType', iconType as 'emoji' | 'fontawesome' | 'image')
    if (iconColor) {
      form.setValue('iconColor', iconColor)
    }
  }

  const toggleSkillSelection = (skillId: string) => {
    const currentSkills = watchedSkillIds || []
    if (currentSkills.includes(skillId)) {
      form.setValue('skillIds', currentSkills.filter((id) => id !== skillId), { shouldValidate: true })
    } else if (currentSkills.length < 3) {
      form.setValue('skillIds', [...currentSkills, skillId], { shouldValidate: true })
    } else {
      toast.error('You can assign a maximum of 3 skills.')
    }
  }

  const toggleCharacterSelection = (characterId: string) => {
    const currentCharacters = watchedCharacterIds || []
    if (currentCharacters.includes(characterId)) {
      form.setValue('characterIds', currentCharacters.filter((id) => id !== characterId), { shouldValidate: true })
    } else if (currentCharacters.length < 3) {
      form.setValue('characterIds', [...currentCharacters, characterId], { shouldValidate: true })
    } else {
      toast.error('You can assign a maximum of 3 characters.')
    }
  }

  const previewXP = watchedUseCustomXP
    ? {
        characterXP: watchedCustomCharacterXP ?? 0,
        skillXP: watchedCustomSkillXP ?? 0,
      }
    : calculateTaskXP(watchedDifficulty, watchedSkillIds.length, watchedCharacterIds.length)

  const onSubmit = async (values: EditTaskFormValues) => {
    if (!task) return
    setIsSubmitting(true)

    try {
      const input: UpdateTaskInput = {
        id: task.id,
        title: values.title,
        description: values.description,
        icon: values.icon || DEFAULT_ICON,
        icon_type: values.iconType,
        icon_color: values.iconColor,
        priority: values.priority,
        difficulty: values.difficulty,
        start_date: values.startDate || undefined,
        due_date: values.dueDate || undefined,
        skill_ids: values.skillIds,
        character_ids: values.characterIds,
        gold_reward: values.goldReward ?? getDefaultGoldReward(values.difficulty),
        use_custom_xp: values.useCustomXP,
        character_xp: values.characterXP ?? previewXP.characterXP,
        skill_xp: values.skillXP ?? previewXP.skillXP,
      }

      const result = await updateTask(input)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(`"${values.title}" has been updated.`)
      onOpenChange(false)
      onTaskUpdated()
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!task) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Update this task&apos;s details, or link skills and characters to it now
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Icon Picker */}
          <FieldGroup>
            <FieldLabel>Icon</FieldLabel>
            <IconPicker
              currentIcon={form.watch('icon') || DEFAULT_ICON}
              currentIconType={form.watch('iconType') as IconType}
              currentIconColor={form.watch('iconColor')}
              onIconChange={handleIconChange}
            />
            <FieldError>{form.formState.errors.icon?.message}</FieldError>
          </FieldGroup>

          {/* Title */}
          <FieldGroup>
            <FieldLabel>Title *</FieldLabel>
            <Input {...form.register('title')} placeholder="e.g., Review Q4 budget report" />
            <FieldError>{form.formState.errors.title?.message}</FieldError>
          </FieldGroup>

          {/* Description */}
          <FieldGroup>
            <FieldLabel>Description</FieldLabel>
            <Textarea
              {...form.register('description')}
              placeholder="Add any additional context or notes..."
              rows={3}
            />
            <FieldError>{form.formState.errors.description?.message}</FieldError>
          </FieldGroup>

          {/* Priority, Difficulty Row */}
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <FieldLabel>Priority *</FieldLabel>
              <Select
                value={form.watch('priority')}
                onValueChange={(value) => form.setValue('priority', value as EditTaskFormValues['priority'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{form.formState.errors.priority?.message}</FieldError>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Difficulty *</FieldLabel>
              <Select
                value={form.watch('difficulty')}
                onValueChange={(value) => form.setValue('difficulty', value as EditTaskFormValues['difficulty'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_DIFFICULTY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{form.formState.errors.difficulty?.message}</FieldError>
            </FieldGroup>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <FieldLabel>Start Date</FieldLabel>
              <Input type="date" {...form.register('startDate')} />
              <FieldError>{form.formState.errors.startDate?.message}</FieldError>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Due Date</FieldLabel>
              <Input type="date" {...form.register('dueDate')} />
              <FieldError>{form.formState.errors.dueDate?.message}</FieldError>
            </FieldGroup>
          </div>

          {/* Skills Selection */}
          <FieldGroup>
            <div className="flex items-center justify-between">
              <FieldLabel>Linked Skills (optional, up to 3)</FieldLabel>
              <span className={cn(
                'text-xs tabular-nums',
                watchedSkillIds.length >= 3 ? 'text-amber-600' : 'text-muted-foreground'
              )}>
                {watchedSkillIds.length} / 3
              </span>
            </div>
            <FieldDescription>
              Optionally select up to 3 skills that this task will develop
            </FieldDescription>
            {availableSkills.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No skills yet. Create one from the Skills page, then come back to link it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-lg border p-3">
                {availableSkills.map((skill) => (
                  <Field
                    key={skill.id}
                    orientation="horizontal"
                    className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-colors ${
                      watchedSkillIds.includes(skill.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <Checkbox
                      checked={watchedSkillIds.includes(skill.id)}
                      onCheckedChange={() => toggleSkillSelection(skill.id)}
                    />
                    <span className="text-sm font-medium truncate flex-1">{skill.title}</span>
                    <Badge variant="outline" className="text-xs">
                      Lv {skill.level}
                    </Badge>
                  </Field>
                ))}
              </div>
            )}
            <FieldError>{form.formState.errors.skillIds?.message}</FieldError>
          </FieldGroup>

          {/* Characters Selection */}
          <FieldGroup>
            <div className="flex items-center justify-between">
              <FieldLabel>Linked Characters (optional, up to 3)</FieldLabel>
              <span className={cn(
                'text-xs tabular-nums',
                watchedCharacterIds.length >= 3 ? 'text-amber-600' : 'text-muted-foreground'
              )}>
                {watchedCharacterIds.length} / 3
              </span>
            </div>
            <FieldDescription>
              Optionally select up to 3 characters who receive XP for this task
            </FieldDescription>
            {availableCharacters.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No characters yet. Create one from the Characters page, then come back to link it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-lg border p-3">
                {availableCharacters.map((character) => (
                  <Field
                    key={character.id}
                    orientation="horizontal"
                    className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-colors ${
                      watchedCharacterIds.includes(character.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <Checkbox
                      checked={watchedCharacterIds.includes(character.id)}
                      onCheckedChange={() => toggleCharacterSelection(character.id)}
                    />
                    <span className="text-sm font-medium truncate flex-1">{character.title}</span>
                  </Field>
                ))}
              </div>
            )}
            <FieldError>{form.formState.errors.characterIds?.message}</FieldError>
          </FieldGroup>

          {/* Rewards Section */}
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Rewards</h4>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-use-custom-xp"
                  checked={watchedUseCustomXP}
                  onCheckedChange={(checked) => form.setValue('useCustomXP', checked as boolean)}
                />
                <Label htmlFor="edit-use-custom-xp" className="text-sm cursor-pointer">
                  Use custom XP values
                </Label>
              </div>
            </div>

            <FieldGroup>
              <FieldLabel>Gold Reward</FieldLabel>
              <Input
                type="number"
                min="0"
                {...form.register('goldReward', { valueAsNumber: true })}
                placeholder={`Default: ${getDefaultGoldReward(watchedDifficulty)}`}
              />
              <FieldError>{form.formState.errors.goldReward?.message}</FieldError>
            </FieldGroup>

            {watchedUseCustomXP && (
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup>
                  <FieldLabel>Character XP</FieldLabel>
                  <Input
                    type="number"
                    min="0"
                    {...form.register('characterXP', { valueAsNumber: true })}
                    placeholder="Enter custom XP"
                  />
                  <FieldError>{form.formState.errors.characterXP?.message}</FieldError>
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel>Skill XP (per skill)</FieldLabel>
                  <Input
                    type="number"
                    min="0"
                    {...form.register('skillXP', { valueAsNumber: true })}
                    placeholder="Enter custom XP"
                  />
                  <FieldError>{form.formState.errors.skillXP?.message}</FieldError>
                </FieldGroup>
              </div>
            )}

            <div className="flex items-center gap-4 pt-2 border-t">
              <div className="flex items-center gap-1.5 text-sm">
                <FaCoins className="h-4 w-4 text-amber-400" />
                <span className="text-muted-foreground">Gold:</span>
                <span className="font-semibold">
                  {form.watch('goldReward') ?? getDefaultGoldReward(watchedDifficulty)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <FaUserGroup className="h-4 w-4 text-cyan-400" />
                <span className="text-muted-foreground">Char XP:</span>
                <span className="font-semibold">{previewXP.characterXP}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <FaCircleArrowUp className="h-4 w-4 text-violet-400" />
                <span className="text-muted-foreground">Skill XP:</span>
                <span className="font-semibold">
                  {previewXP.skillXP} × {watchedSkillIds.length} = {previewXP.skillXP * watchedSkillIds.length}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
