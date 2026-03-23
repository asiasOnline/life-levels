'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Field,
  FieldLabel
} from '@/components/ui/field'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IconPicker } from '@/components/layout/app/icon-picker'
import { 
  IconType, 
  DEFAULT_ICON, 
  DEFAULT_ICON_TYPE, 
  DEFAULT_ICON_COLOR 
} from "@/lib/types/icon"
import { AVATAR_REGISTRY } from './avatars/avatar-registry'
import { AvatarRenderer } from './avatars/avatar-renderer'
import { CharacterAvatarData } from '@/lib/types/character'
import { createCharacter } from '@/lib/actions/character'
import { cn } from '@/lib/utils'

// =======================================
// CONSTANTS
// =======================================

const COLOR_PALETTE = [
  { hex: '#6366f1', label: 'Indigo'   },
  { hex: '#8b5cf6', label: 'Violet'   },
  { hex: '#ec4899', label: 'Pink'     },
  { hex: '#ef4444', label: 'Red'      },
  { hex: '#f97316', label: 'Orange'   },
  { hex: '#eab308', label: 'Yellow'   },
  { hex: '#22c55e', label: 'Green'    },
  { hex: '#14b8a6', label: 'Teal'     },
  { hex: '#3b82f6', label: 'Blue'     },
  { hex: '#06b6d4', label: 'Cyan'     },
  { hex: '#a16207', label: 'Amber'    },
  { hex: '#64748b', label: 'Slate'    },
]

const SKIN_TONES = [
  { value: '#FDDBB4', label: 'Light'        },
  { value: '#F5C89A', label: 'Light Medium' },
  { value: '#D4A57A', label: 'Medium'       },
  { value: '#B07D50', label: 'Medium Dark'  },
  { value: '#7C4E2A', label: 'Dark'         },
  { value: '#4A2C15', label: 'Deep'         },
]

// =======================================
// SCHEMA
// =======================================

const createCharacterSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(50, 'Title must be 50 characters or fewer'),
  icon: z
      .string()
      .optional(),
      iconType: z
      .enum(['emoji', 'fontawesome', 'image']),
      iconColor: z
      .string()
      .optional(),
  color_theme: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Please select a color theme'),
  description: z.string().max(500, 'Description must be 500 characters or fewer').optional(),
})

type CreateCharacterFormValues = z.infer<typeof createCharacterSchema>

// =======================================
// PROPS
// =======================================

interface CreateCharacterModalProps {
  isOpen: boolean
  onClose: (open: boolean) => void
  onCharacterCreated?: () => void
  characterLevel?: number // defaults to 1 for creation
}

// =======================================
// COMPONENT
// =======================================

export function CreateCharacterModal({
  isOpen,
  onClose,
  onCharacterCreated,
  characterLevel = 1,
}: CreateCharacterModalProps) {
  const [activeTab, setActiveTab] = useState<'basics' | 'avatar'>('basics')
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null)
  const [skinTone, setSkinTone] = useState<string>(SKIN_TONES[0].value)
  const [clothingColor, setClothingColor] = useState<string | null>(null) // null = follow color_theme
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<CreateCharacterFormValues>({
    resolver: zodResolver(createCharacterSchema),
    defaultValues: {
      title: '',
      icon: DEFAULT_ICON,
      iconType: DEFAULT_ICON_TYPE,
      iconColor: DEFAULT_ICON_COLOR,
      color_theme: COLOR_PALETTE[0].hex,
      description: '',
    },
  })

  const selectedColor = form.watch('color_theme')

  // The effective clothing color — either manually set or inheriting the character's theme
  const effectiveClothingColor = clothingColor ?? selectedColor

  function handleClose() {
    form.reset()
    setSelectedArchetype(null)
    setSkinTone(SKIN_TONES[0].value)
    setClothingColor(null)
    setActiveTab('basics')
    setSubmitError(null)
    onClose(false)
  }

  const handleIconChange = (icon: string, icon_type: IconType, icon_color?: string) => {
      form.setValue('icon', icon)
      form.setValue('iconType', icon_type)
      if (icon_color) {
        form.setValue('iconColor', icon_color)
      }
    }

  async function onSubmit(values: CreateCharacterFormValues) {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const avatar: CharacterAvatarData | null = selectedArchetype
        ? {
            archetype_id:   selectedArchetype,
            skin_tone:      skinTone,
            clothing_color: clothingColor, // null = inherits color_theme at render time
          }
        : null

      await createCharacter({
        title: values.title,
        color_theme: values.color_theme,
        icon: values.icon || DEFAULT_ICON,
        icon_type: values.iconType,
        icon_color: values.iconColor,
        description: values.description || undefined,
        avatar,
      })

      handleClose()
      onCharacterCreated?.()
    } catch (error: any) {
      console.error('Failed to create character:', error)

      if (error?.code === '23505') {
        // Unique violation — could be title or color_theme
        if (error.message?.includes('unique_character_title_per_user')) {
          setSubmitError('You already have a character with this title. Please choose a different name.')
        } else if (error.message?.includes('unique_color_theme_per_user')) {
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-140 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Character</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'basics' | 'avatar')}
          >
            <TabsList className="w-full">
              <TabsTrigger value="basics" className="flex-1">Basics</TabsTrigger>
              <TabsTrigger value="avatar" className="flex-1">Avatar</TabsTrigger>
            </TabsList>

            {/* ─── BASICS TAB ─────────────────────────────────── */}
            <TabsContent value="basics" className="space-y-5 pt-2">

              {/* Icon */}
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

              {/* Title */}
              <Field className="space-y-2">
                <FieldLabel htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="title"
                  placeholder="e.g. Work Self, The Athlete, Aphrodite"
                  {...form.register('title')}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
                )}
              </Field>

              {/* Color Theme */}
              <Field className="space-y-3">
                <Label>
                  Color Theme <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      title={color.label}
                      onClick={() => {
                        form.setValue('color_theme', color.hex, { shouldValidate: true })
                        // If clothing color was following the old theme, keep following
                        if (clothingColor === null) {
                          // no-op: clothing will auto-follow the new theme
                        }
                      }}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 transition-all',
                        selectedColor === color.hex
                          ? 'border-foreground scale-110 shadow-md'
                          : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>

                {/* Live preview swatch */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div
                    className="w-8 h-8 rounded-md shadow-sm shrink-0 transition-colors"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {COLOR_PALETTE.find(c => c.hex === selectedColor)?.label ?? 'Custom'} —{' '}
                    <span className="font-mono text-xs">{selectedColor}</span>
                  </span>
                </div>

                {form.formState.errors.color_theme && (
                  <p className="text-sm text-destructive">{form.formState.errors.color_theme.message}</p>
                )}
              </Field>

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
                  {...form.register('description')}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                )}
              </Field>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('avatar')}
                >
                  Customize Avatar →
                </Button>
              </div>
            </TabsContent>

            {/* ─── AVATAR TAB ─────────────────────────────────── */}
            <TabsContent value="avatar" className="space-y-5 pt-2">

              {/* Archetype selection */}
              <div className="space-y-2">
                <Label>
                  Archetype{' '}
                  <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Choose an avatar to represent this character. You can skip this and add one later.
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_REGISTRY.map((archetype) => {
                    const isLocked = archetype.lockedUntilLevel
                      ? characterLevel < archetype.lockedUntilLevel
                      : false
                    const isSelected = selectedArchetype === archetype.id

                    return (
                      <button
                        key={archetype.id}
                        type="button"
                        disabled={isLocked}
                        onClick={() =>
                          setSelectedArchetype(isSelected ? null : archetype.id)
                        }
                        className={cn(
                          'relative flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-xs overflow-hidden', // add overflow-hidden
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/40 hover:bg-muted/40',
                          isLocked && 'opacity-40 cursor-not-allowed hover:border-border hover:bg-transparent'
                        )}
                      >
                        <AvatarRenderer
                          archetypeId={archetype.id}
                          skinTone={skinTone}
                          clothingColor={effectiveClothingColor}
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
              </div>

              {/* Customization — only shown if an archetype is selected */}
              {selectedArchetype && (
                <>
                  {/* Skin Tone */}
                  <div className="space-y-3">
                    <Label>Skin Tone</Label>
                    <div className="flex gap-2">
                      {SKIN_TONES.map((tone) => (
                        <button
                          key={tone.value}
                          type="button"
                          title={tone.label}
                          onClick={() => setSkinTone(tone.value)}
                          className={cn(
                            'w-8 h-8 rounded-full border-2 transition-all',
                            skinTone === tone.value
                              ? 'border-foreground scale-110 shadow-md'
                              : 'border-transparent hover:scale-105'
                          )}
                          style={{ backgroundColor: tone.value }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Clothing Color */}
                  <div className="space-y-3">
                    <Label>Clothing Color</Label>
                    <p className="text-xs text-muted-foreground">
                      Defaults to your character's color theme. Override below if you'd like.
                    </p>

                    {/* "Follow theme" toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setClothingColor(null)}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-xs font-medium border transition-all',
                          clothingColor === null
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                        )}
                      >
                        Follow theme
                      </button>
                      <div
                        className="w-5 h-5 rounded-full border border-border shrink-0"
                        style={{ backgroundColor: selectedColor }}
                        title="Current theme color"
                      />
                    </div>

                    {/* Palette override */}
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          title={color.label}
                          onClick={() => setClothingColor(color.hex)}
                          className={cn(
                            'w-8 h-8 rounded-full border-2 transition-all',
                            clothingColor === color.hex
                              ? 'border-foreground scale-110 shadow-md'
                              : 'border-transparent hover:scale-105'
                          )}
                          style={{ backgroundColor: color.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Live avatar preview */}
                  <Field>
                    <FieldLabel>Preview</FieldLabel>
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center shadow-sm border overflow-hidden"
                      style={{ backgroundColor: effectiveClothingColor + '22', borderColor: effectiveClothingColor + '66' }}
                    >
                      {selectedArchetype && (
                        <AvatarRenderer
                          archetypeId={selectedArchetype}
                          skinTone={skinTone}
                          clothingColor={effectiveClothingColor}
                          size={56}
                        />
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">
                        {AVATAR_REGISTRY.find(a => a.id === selectedArchetype)?.label}
                      </p>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: skinTone }}
                          />
                          <span className="text-muted-foreground text-xs">
                            {SKIN_TONES.find(t => t.value === skinTone)?.label} skin
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: effectiveClothingColor }}
                          />
                          <span className="text-muted-foreground text-xs">
                            {clothingColor === null
                              ? `${COLOR_PALETTE.find(c => c.hex === selectedColor)?.label ?? 'Theme'} (theme)`
                              : COLOR_PALETTE.find(c => c.hex === clothingColor)?.label ?? 'Custom'}{' '}
                            clothing
                          </span>
                        </div>
                      </div>
                  </Field>
                </>
              )}

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('basics')}
                >
                  ← Back to Basics
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Error message */}
          {submitError && (
            <p className="text-sm text-destructive text-center">{submitError}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Character'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}