// components/features/skills/edit-skill-modal.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconPicker } from '@/components/layout/app/icon-picker/icon-picker'
import { IconType } from '@/components/layout/app/icon-picker/types'
import { SkillData } from './types'
import { updateSkill } from '@/lib/actions/skill'
import { toast } from 'sonner'


const editSkillSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  icon: z.string().optional(),
  iconType: z.enum(['emoji', 'icon', 'image']),
  iconColor: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

type EditSkillFormValues = z.infer<typeof editSkillSchema>

interface EditSkillModalProps {
  skill: SkillData
  open: boolean
  onOpenChange: (open: boolean) => void
  onSkillUpdated: () => void
}

export function EditSkillModal({
  skill,
  open,
  onOpenChange,
  onSkillUpdated,
}: EditSkillModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const form = useForm<EditSkillFormValues>({
    resolver: zodResolver(editSkillSchema),
    defaultValues: {
      title: skill.title,
      description: skill.description || '',
      icon: skill.icon,
      iconType: skill.iconType,
      iconColor: skill.iconColor,
      tags: skill.tags || [],
    },
  })

  // Reset form when skill changes
  useEffect(() => {
    form.reset({
      title: skill.title,
      description: skill.description || '',
      icon: skill.icon,
      iconType: skill.iconType,
      iconColor: skill.iconColor,
      tags: skill.tags || [],
    })
  }, [skill, form])

  const tags = form.watch('tags') || []

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      form.setValue('tags', [...tags, trimmedTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    form.setValue('tags', tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleIconChange = (icon: string, iconType: IconType, iconColor?: string) => {
    form.setValue('icon', icon)
    form.setValue('iconType', iconType)
    if (iconColor) {
      form.setValue('iconColor', iconColor)
    }
  }

  const onSubmit = async (values: EditSkillFormValues) => {
    setIsSubmitting(true)

    try {
      await updateSkill(skill.id, {
        title: values.title,
        description: values.description,
        icon: values.icon,
        iconType: values.iconType,
        iconColor: values.iconColor,
        tags: values.tags,
      })

      toast.success(`${values.title} has been updated.`)

      onSkillUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating skill:', error)
      toast.error('Failed to update skill. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Skill</DialogTitle>
          <DialogDescription>
            Update your skill details and preferences.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            {/* Icon Picker */}
            <Field>
              <FieldLabel htmlFor="skill-icon">Icon</FieldLabel>
              <IconPicker
                currentIcon={form.watch('icon')}
                currentIconType={form.watch('iconType')}
                currentIconColor={form.watch('iconColor')}
                onIconChange={handleIconChange}
              />
              {form.formState.errors.icon && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.icon.message}
                </p>
              )}
            </Field>

            {/* Title Field */}
            <Field>
              <FieldLabel htmlFor="skill-title">Title *</FieldLabel>
              <Input
                id="skill-title"
                placeholder="e.g., Guitar Playing"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </Field>

            {/* Description Field */}
            <Field>
              <FieldLabel htmlFor="skill-description">Description</FieldLabel>
              <Textarea
                id="skill-description"
                placeholder="Describe what this skill represents..."
                className="resize-none"
                rows={3}
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </Field>

            {/* Tags Field */}
            <Field>
              <FieldLabel htmlFor="skill-tags">Tags</FieldLabel>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="skill-tags"
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddTag}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <FieldDescription>
                Press Enter or click + to add tags
              </FieldDescription>
            </Field>

            <Field orientation="horizontal">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}