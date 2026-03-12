'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IconPicker } from '@/components/layout/app/icon-picker'
import { IconData, IconType } from '@/lib/types/icon'
import { Character, CharacterAvatarData } from '@/lib/types/character'
import { updateCharacter } from '@/lib/actions/character'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// =======================================
// CONSTANTS (mirrors CreateCharacterModal)
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

const AVATAR_ARCHETYPES = [
  { id: 'warrior',   label: 'Warrior',   emoji: '⚔️'  },
  { id: 'scholar',   label: 'Scholar',   emoji: '📚'  },
  { id: 'explorer',  label: 'Explorer',  emoji: '🧭'  },
  { id: 'athlete',   label: 'Athlete',   emoji: '🏃'  },
  { id: 'artisan',   label: 'Artisan',   emoji: '🎨'  },
  { id: 'mystic',    label: 'Mystic',    emoji: '🔮'  },
  { id: 'healer',    label: 'Healer',    emoji: '💚'  },
  { id: 'architect', label: 'Architect', emoji: '🏛️'  },
]

// =======================================
// SCHEMA
// =======================================

const editCharacterSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(50, 'Title must be 50 characters or fewer'),
  icon: z.string().optional(),
    iconType: z.enum(['emoji', 'fontawesome', 'image']),
    iconColor: z.string().optional(),
  color_theme: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Please select a color theme'),
  description: z.string()
    .max(500, 'Description must be 500 characters or fewer')
    .optional(),
})

type EditCharacterFormValues = z.infer<typeof editCharacterSchema>

// =======================================
// PROPS
// =======================================

interface EditCharacterModalProps {
  character: Character
  open: boolean
  onOpenChange: (open: boolean) => void
  onCharacterUpdated: () => void
}

// =======================================
// MAIN COMPONENT
// =======================================

export function EditCharacterModal({
  character,
  open,
  onOpenChange,
  onCharacterUpdated,
}: EditCharacterModalProps) {
  const existingAvatar = character.avatar as CharacterAvatarData | null
  const existingIcon   = character.icon   as IconData

  // ── Local state for fields outside RHF ──────────────────────────────────
  const [icon, setIcon]                         = useState<IconData>(existingIcon)
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(
    existingAvatar?.archetype_id ?? null
  )
  const [skinTone, setSkinTone]                 = useState<string>(
    existingAvatar?.skin_tone ?? SKIN_TONES[0].value
  )
  // null = follow color_theme; string = explicit override
  const [clothingColor, setClothingColor]       = useState<string | null>(
    existingAvatar?.clothing_color ?? null
  )
  const [isSubmitting, setIsSubmitting]         = useState(false)

  const form = useForm<EditCharacterFormValues>({
    resolver: zodResolver(editCharacterSchema),
    defaultValues: {
      title:       character.title,
      icon: character.icon.value,
      iconType: character.icon.type,
      iconColor: character.icon.color,
      color_theme: character.color_theme,
      description: character.description || '',
    },
  })

  // Reset all state when the character prop changes (e.g. opening on a different character)
  useEffect(() => {
    const latestAvatar = character.avatar as CharacterAvatarData | null
    const latestIcon   = character.icon   as IconData

    form.reset({
      title:       character.title,
      icon: character.icon.value,
      iconType: character.icon.type,
      iconColor: character.icon.color,
      color_theme: character.color_theme,
      description: character.description || '',
    })
    setIcon(latestIcon)
    setSelectedArchetype(latestAvatar?.archetype_id ?? null)
    setSkinTone(latestAvatar?.skin_tone ?? SKIN_TONES[0].value)
    setClothingColor(latestAvatar?.clothing_color ?? null)
  }, [character, form])

  const selectedColor     = form.watch('color_theme')
  const effectiveClothing = clothingColor ?? selectedColor

  // When the color theme changes and clothing is following the theme, nothing extra
  // is needed — effectiveClothing derives from selectedColor automatically.
  // But if the user had previously set the clothing to match the OLD theme color
  // explicitly, we leave that alone (it's their explicit choice).

  function handleIconChange(value: string, type: IconType, color?: string) {
    setIcon({ type, value, color })
  }

  async function onSubmit(values: EditCharacterFormValues) {
    setIsSubmitting(true)
    try {
      const avatar: CharacterAvatarData | null = selectedArchetype
        ? {
            archetype_id:   selectedArchetype,
            skin_tone:      skinTone,
            clothing_color: clothingColor,
          }
        : null

      await updateCharacter(character.id, {
        title:       values.title,
        color_theme: values.color_theme,
        icon: values.icon,
        icon_type: values.iconType,
        icon_color: values.iconColor,
        description: values.description || undefined,
        avatar,
      })

      toast.success(`${values.title} has been updated.`)
      onCharacterUpdated()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error updating character:', error)

      if (error?.code === '23505') {
        if (error.message?.includes('unique_character_title_per_user')) {
          form.setError('title', {
            message: 'You already have a character with this title.',
          })
        } else if (error.message?.includes('unique_color_theme_per_user')) {
          form.setError('color_theme', {
            message: 'You already have a character using this color.',
          })
        } else {
          toast.error('A character with this title or color already exists.')
        }
      } else {
        toast.error('Failed to update character. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-140 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Character</DialogTitle>
          <DialogDescription>
            Update your character's details and appearance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basics">
            <TabsList className="w-full">
              <TabsTrigger value="basics" className="flex-1">Basics</TabsTrigger>
              <TabsTrigger value="avatar" className="flex-1">Avatar</TabsTrigger>
            </TabsList>

            {/* ─── BASICS TAB ─────────────────────────────────── */}
            <TabsContent value="basics" className="space-y-5 pt-2">

              {/* Icon */}
              <div className="space-y-2">
                <Label>Icon</Label>
                <IconPicker
                  currentIcon={icon.value}
                  currentIconType={icon.type}
                  currentIconColor={icon.color}
                  onIconChange={handleIconChange}
                />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="edit-char-title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-char-title"
                  placeholder="e.g. Work Self, The Athlete, Aphrodite"
                  {...form.register('title')}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              {/* Color Theme */}
              <div className="space-y-3">
                <Label>
                  Color Theme <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      title={color.label}
                      onClick={() =>
                        form.setValue('color_theme', color.hex, { shouldValidate: true })
                      }
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
                  <p className="text-sm text-destructive">
                    {form.formState.errors.color_theme.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="edit-char-description">
                  Description{' '}
                  <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="edit-char-description"
                  placeholder="What does this character represent?"
                  rows={3}
                  className="resize-none"
                  {...form.register('description')}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.description.message}
                  </p>
                )}
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
                  Select an archetype or deselect the current one to remove the avatar entirely.
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_ARCHETYPES.map((archetype) => (
                    <button
                      key={archetype.id}
                      type="button"
                      onClick={() =>
                        setSelectedArchetype(
                          selectedArchetype === archetype.id ? null : archetype.id
                        )
                      }
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-xs',
                        selectedArchetype === archetype.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/40 hover:bg-muted/40'
                      )}
                    >
                      <span className="text-2xl">{archetype.emoji}</span>
                      <span className="font-medium text-foreground">{archetype.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customization — only shown when an archetype is selected */}
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

                  {/* Live preview */}
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30">
                      <div
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-sm border"
                        style={{
                          backgroundColor: effectiveClothing + '22',
                          borderColor: effectiveClothing + '66',
                        }}
                      >
                        {AVATAR_ARCHETYPES.find(a => a.id === selectedArchetype)?.emoji}
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium capitalize">{selectedArchetype}</p>
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
                            style={{ backgroundColor: effectiveClothing }}
                          />
                          <span className="text-muted-foreground text-xs">
                            {clothingColor === null
                              ? `${COLOR_PALETTE.find(c => c.hex === selectedColor)?.label ?? 'Theme'} (theme)`
                              : COLOR_PALETTE.find(c => c.hex === clothingColor)?.label ?? 'Custom'
                            }{' '}clothing
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2">
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}