'use client'

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreateSkillInput } from "@/lib/types/skills"
import { createSkill } from "@/lib/actions/skills"
import { IconPicker } from "@/components/layout/app/icon-picker"
import { 
  IconType, 
  DEFAULT_ICON, 
  DEFAULT_ICON_TYPE, 
  DEFAULT_ICON_COLOR, 
  DEFAULT_ICON_DATA
} from "@/lib/types/icon"
import { toast } from "sonner"
import { FaPlus, FaXmark, FaCheck } from "react-icons/fa6";
import { fetchActiveCharacters } from "@/lib/actions/characters"
import { CharacterSummary } from "@/lib/types/character"

// ==========================================
// ZOD SCHEMA
// ==========================================

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
    .enum(['emoji', 'fontawesome', 'image']),
    iconColor: z
    .string()
    .optional(),
    tags: z
    .array(z.string())
    .optional(),
    character_ids: z
    .array(z.string())
    .optional(),
})

type CreateSkillFormValues = z.infer<typeof createSkillSchema>

// ================================
// PROPS
// ================================

interface CreateSkillModalProps {
    isOpen: boolean
    onClose: (open: boolean) => void
    onSkillCreated: () => void
    availableCharacters: CharacterSummary[]
}

// ===============================
// MAIN COMPONENT
// ===============================

export function CreateSkillModal({
  isOpen,
  onClose,
  onSkillCreated,
  availableCharacters,
}: CreateSkillModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [tagInput, setTagInput] = useState("")

    const form = useForm<CreateSkillFormValues>({
        resolver: zodResolver(createSkillSchema),
        defaultValues: {
            title: "",
            description: "",
            icon: DEFAULT_ICON,
            iconType: DEFAULT_ICON_TYPE as 'emoji' | 'fontawesome' | 'image',
            iconColor: DEFAULT_ICON_COLOR,
            tags: [],
            character_ids: [],
        },
    })

    const tags = form.watch("tags") || []
    const selectedCharacterIds = form.watch("character_ids") || []

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

    const handleIconChange = (icon: string, icon_type: IconType, icon_color?: string) => {
        form.setValue('icon', icon)
        form.setValue('iconType', icon_type)
        if (icon_color) {
            form.setValue('iconColor', icon_color)
        }
    }

    const toggleCharacter = (id: string) => {
        const current = form.getValues('character_ids') || []
        form.setValue(
            'character_ids',
            current.includes(id) ? current.filter((c) => c !== id) : [...current, id]
        )
    }

    // ── Submit ──────────────────────────────
    const onSubmit = async (values: CreateSkillFormValues) => {
        setIsSubmitting(true)

        try {
            const input: CreateSkillInput = {
                title: values.title,
                description: values.description,
                icon: values.icon || DEFAULT_ICON_DATA.value,
                icon_type: values.iconType,
                icon_color: values.iconColor,
                tags: values.tags,
                character_ids: values.character_ids,
            }

            const result = await createSkill(input)

            if (!result.success) {
              toast.error(result.error)
              return
            }
            
            toast.success(`${values.title} has been added to your skill log.`)

            form.reset()
            onClose(false)
            onSkillCreated()
        } catch (error) {
            console.error('Error creating skill:', error)
            toast.error("Failed to create skill. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
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

            {/* Characters Field */}
            <Field>
              <FieldLabel>Link to Characters</FieldLabel>
              {availableCharacters.length === 0 ? (
                <p className="text-sm text-muted-foreground">No characters found.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableCharacters.map((character) => {
                    const isSelected = selectedCharacterIds.includes(character.id)
                    return (
                      <button
                        key={character.id}
                        type="button"
                        onClick={() => toggleCharacter(character.id)}
                        className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors"
                        style={{
                          borderColor: character.color_theme,
                          backgroundColor: isSelected ? character.color_theme : 'transparent',
                          color: isSelected ? '#fff' : 'inherit',
                        }}
                      >
                        {isSelected && <FaCheck className="h-3 w-3" />}
                        {character.title}
                      </button>
                    )
                  })}
                </div>
              )}
              <FieldDescription>
                Select characters this skill will contribute XP to.
              </FieldDescription>
            </Field>

            <Field orientation="horizontal">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Skill'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose(false)}
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
