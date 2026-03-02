'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
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
import { IconPicker } from "@/components/layout/app/icon-picker"
import { 
  IconType, 
  DEFAULT_ICON, 
  DEFAULT_ICON_TYPE, 
  DEFAULT_ICON_COLOR 
} from "@/lib/types/icon"
import { toast } from "sonner" 
import {
  TASK_STATUS,
  TASK_PRIORITY,
  TASK_DIFFICULTY,
  TASK_PRIORITY_LABELS,
  TASK_DIFFICULTY_LABELS,
  TASK_STATUS_LABELS,
} from '@/lib/types/tasks'
import { 
  getDefaultGoldReward, 
  calculateTaskXP, 
  validateSkillCount 
} from '@/lib/utils/tasks'
import { FaRegCalendarDays, FaClock, FaCoins, FaStar, FaCircleArrowUp, FaUserGroup } from "react-icons/fa6";

// ─── Task Schema ─────────────────────

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  icon: z.string().optional(),
  iconType: z.enum(['emoji', 'fontawesome', 'image']),
  iconColor: z.string().optional(),
  status: z.enum(['backlog', 'in_progress', 'paused', 'completed']),
  priority: z.enum(['critical', 'high', 'mid', 'low']),
  difficulty: z.enum(['easy', 'normal', 'hard', 'expert']),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  skillIds: z
    .array(z.string())
    .min(1, 'At least 1 skill is required')
    .max(3, 'Maximum 3 skills allowed'),
  goldReward: z.number().min(0).optional(),
  useCustomXP: z.boolean(),
  customCharacterXP: z.number().min(0).optional(),
  customSkillXP: z.number().min(0).optional(),
}).refine(
  (data) => {
    if (data.startDate && data.dueDate) {
      return new Date(data.startDate) <= new Date(data.dueDate)
    }
    return true
  },
  {
    message: 'Due date must be after start date',
    path: ['due_date'],
  }
)

type CreateTaskFormValues = z.infer<typeof createTaskSchema>

// ─── Object Types ──────────────────────────

interface Skill {
  id: string
  title: string
  icon: string
  icon_type: string
  icon_color: string
  level: number
}

interface CreateTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreated: () => void
}

// ─── Main Component ───────────────────────

export function CreateTaskModal({ open, onOpenChange, onTaskCreated }: CreateTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoadingSkills, setIsLoadingSkills] = useState(true)

  const form = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      icon: DEFAULT_ICON,
      iconType: DEFAULT_ICON_TYPE as 'emoji' | 'fontawesome' | 'image',
      iconColor: DEFAULT_ICON_COLOR,
      status: TASK_STATUS.BACKLOG,
      priority: TASK_PRIORITY.MID,
      difficulty: TASK_DIFFICULTY.NORMAL,
      startDate: '',
      dueDate: '',
      skillIds: [],
      goldReward: undefined,
      useCustomXP: false,
      customCharacterXP: undefined,
      customSkillXP: undefined,
    },
  })

  const watchedDifficulty = form.watch('difficulty')
  const watchedSkillIds = form.watch('skillIds')
  const watchedUseCustomXP = form.watch('useCustomXP')
  const watchedCustomCharacterXP = form.watch('customCharacterXP')
  const watchedCustomSkillXP = form.watch('customSkillXP')

  // Load skills on mount
  useEffect(() => {
    loadSkills()
  }, [])

  // Auto-calculate gold reward when difficulty changes
  useEffect(() => {
    if (watchedDifficulty && form.getValues('goldReward') === undefined) {
      const defaultGold = getDefaultGoldReward(watchedDifficulty)
      form.setValue('goldReward', defaultGold)
    }
  }, [watchedDifficulty])

  async function loadSkills() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('skills')
        .select('id, title, icon, icon_type, icon_color, level')
        .order('title')

      if (error) throw error

      setSkills(data || [])
    } catch (error) {
      console.error('Error loading skills:', error)
      toast.error('Error loading skills')
    } finally {
      setIsLoadingSkills(false)
    }
  }

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
      form.setValue(
        'skillIds',
        currentSkills.filter((id) => id !== skillId)
      )
    } else if (currentSkills.length < 3) {
      form.setValue('skillIds', [...currentSkills, skillId])
    }
  }

  async function onSubmit(values: CreateTaskFormValues) {
    setIsSubmitting(true)

    try {
      const { createTask } = await import('@/lib/actions/tasks')
      await createTask({
        title: values.title,
        description: values.description,
        icon: values.icon || DEFAULT_ICON,
        iconType: values.iconType,
        iconColor: values.iconColor,
        status: values.status,
        priority: values.priority,
        difficulty: values.difficulty,
        start_date: values.startDate,
        due_date: values.dueDate,
        skillIds: values.skillIds,
        gold_reward: values.goldReward,
        use_custom_xp: values.useCustomXP,
        custom_character_xp: values.customCharacterXP,
        custom_skill_xp: values.customSkillXP,
      })

      toast.success(`${values.title} has been created.`)

      form.reset()
      onOpenChange(false)
      onTaskCreated()
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error("Failed to create task. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate preview XP values
  const previewXP = watchedUseCustomXP
    ? {
        characterXP: watchedCustomCharacterXP ?? 0,
        skillXP: watchedCustomSkillXP ?? 0,
      }
    : calculateTaskXP(watchedDifficulty, watchedSkillIds.length, 1)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a one-time activity to track and complete
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
            <Input
              {...form.register('title')}
              placeholder="e.g., Review Q4 budget report"
            />
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

          {/* Status, Priority, Difficulty Row */}
          <div className="grid grid-cols-3 gap-4">
            <FieldGroup>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={form.watch('status')}
                onValueChange={(value) => form.setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{form.formState.errors.status?.message}</FieldError>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Priority *</FieldLabel>
              <Select
                value={form.watch('priority')}
                onValueChange={(value) => form.setValue('priority', value as any)}
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
                onValueChange={(value) => form.setValue('difficulty', value as any)}
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
              <Input
                type="date"
                {...form.register('startDate')}
              />
              <FieldError>{form.formState.errors.startDate?.message}</FieldError>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Due Date</FieldLabel>
              <Input
                type="date"
                {...form.register('dueDate')}
              />
              <FieldError>{form.formState.errors.dueDate?.message}</FieldError>
            </FieldGroup>
          </div>

          {/* Skills Selection */}
          <FieldGroup>
            <FieldLabel>Linked Skills * (1-3 required)</FieldLabel>
            <FieldDescription>
              Select 1 to 3 skills that this task will develop
            </FieldDescription>
            {isLoadingSkills ? (
              <div className="text-sm text-muted-foreground">Loading skills...</div>
            ) : skills.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No skills found. Create a skill first to continue.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-lg border p-3">
                {skills.map((skill) => (
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
                    <span className="text-sm font-medium truncate flex-1">
                      {skill.title}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Lv {skill.level}
                    </Badge>
                  </Field>
                ))}
              </div>
            )}
            <FieldError>{form.formState.errors.skillIds?.message}</FieldError>
          </FieldGroup>

          {/* Rewards Section */}
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Rewards</h4>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="use-custom-xp"
                  checked={watchedUseCustomXP}
                  onCheckedChange={(checked) =>
                    form.setValue('useCustomXP', checked as boolean)
                  }
                />
                <Label htmlFor="use-custom-xp" className="text-sm cursor-pointer">
                  Use custom XP values
                </Label>
              </div>
            </div>

            {/* Gold Reward */}
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

            {/* Custom XP inputs */}
            {watchedUseCustomXP && (
              <div className="grid grid-cols-2 gap-4">
                <FieldGroup>
                  <FieldLabel>Character XP</FieldLabel>
                  <Input
                    type="number"
                    min="0"
                    {...form.register('customCharacterXP', { valueAsNumber: true })}
                    placeholder="Enter custom XP"
                  />
                  <FieldError>
                    {form.formState.errors.customCharacterXP?.message}
                  </FieldError>
                </FieldGroup>

                <FieldGroup>
                  <FieldLabel>Skill XP (per skill)</FieldLabel>
                  <Input
                    type="number"
                    min="0"
                    {...form.register('customSkillXP', { valueAsNumber: true })}
                    placeholder="Enter custom XP"
                  />
                  <FieldError>
                    {form.formState.errors.customSkillXP?.message}
                  </FieldError>
                </FieldGroup>
              </div>
            )}

            {/* XP Preview */}
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
            <Button 
              type="submit" 
              disabled={isSubmitting || skills.length === 0}
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}