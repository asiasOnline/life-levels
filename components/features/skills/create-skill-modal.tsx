'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { 
    Field, 
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconPicker } from "@/components/layout/app/icon-picker/icon-picker"
import { IconType, DEFAULT_ICON, DEFAULT_ICON_TYPE, DEFAULT_ICON_COLOR } from "@/components/layout/app/icon-picker/types"
import { toast } from "sonner"
import { FaPlus, FaXmark } from "react-icons/fa6";

const createSkillSchema = z.object({
    title: z
    .string()
    .min(1, "Name is required"),
    description: z
    .string()
    .optional(),
    icon: z
    .string()
    .optional(),
    iconType: z
    .enum(['emoji', 'icon', 'image']),
    iconColor: z
    .string()
    .optional(),
    tags: z
    .array(z.string())
    .optional(),
})

type CreateSkillFormValues = z.infer<typeof createSkillSchema>

interface CreateSkillModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSkillCreated: () => void
}

export function CreateSkillModal({ isOpen, onOpenChange, onSkillCreated }: CreateSkillModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [tagInput, setTagInput] = useState("")
    
    const form = useForm<CreateSkillFormValues>({
        resolver: zodResolver(createSkillSchema),
        defaultValues: {
            title: "",
            description: "",
            icon: DEFAULT_ICON,
            iconType: DEFAULT_ICON_TYPE,
            iconColor: DEFAULT_ICON_COLOR,
            tags: [],
        },
    })

    const tags = form.watch("tags") || []

    const handleAddTag = () => {
        const newTag = tagInput.trim()
        if (newTag && !tags.includes(newTag)) {
            form.setValue("tags", [...tags, newTag])
            setTagInput("")
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        form.setValue("tags", tags.filter((tag) => tag !== tagToRemove))
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

  const onSubmit = async (values: CreateSkillFormValues) => {
    setIsSubmitting(true)

    try {
      const { createSkill } = await import('@/lib/actions/skill')
      await createSkill({
        title: values.title,
        description: values.description,
        icon: values.icon || DEFAULT_ICON,
        iconType: values.iconType,
        iconColor: values.iconColor,
        tags: values.tags,
      })

      toast.success(`${values.title} has been added to your skill log.`)

      form.reset()
      onOpenChange(false)
      onSkillCreated()
    } catch (error) {
      console.error('Error creating skill:', error)
      toast.error("Failed to create skill. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Skill</DialogTitle>
          <DialogDescription>
            Add a new skill to track your progress and earn XP.
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
                    <FaPlus className="h-4 w-4" />
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
                          <FaXmark className="h-3 w-3" />
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

            {/* Future fields placeholder */}
            <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              Link to Characters, Habits, Tasks & Goals (Coming Soon)
            </div>

            <Field orientation="horizontal">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Skill'}
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