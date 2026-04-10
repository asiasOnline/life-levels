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
import {
  Character,
  CharacterAvatarData,
  SKIN_TONES,
  SkinToneKey,
  DEFAULT_SKIN_TONE,
} from '@/lib/types/character'
import { AVATAR_REGISTRY } from './avatars/avatar-registry'
import { AvatarRenderer } from './avatars/avatar-renderer'
import { updateCharacter } from '@/lib/actions/characters'
import { toast } from 'sonner'
import { cn } from '@/lib/utils/general'

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
 
const SKIN_TONE_LABELS: Record<SkinToneKey, string> = {
  light:       'Light',
  mediumLight: 'Medium Light',
  medium:      'Medium',
  mediumDark:  'Medium Dark',
  deep:        'Deep',
}

// =======================================
// SCHEMA
// =======================================

const editCharacterSchema = z.object({
  title: z
    .string()
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
  color_theme: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Please select a color theme'),
  description: z
    .string()
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
 
  const [icon, setIcon]                           = useState<IconData>(existingIcon)
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(
    existingAvatar?.archetype_id ?? null
  )
  const [skinTone, setSkinTone] = useState<SkinToneKey>(
    (existingAvatar?.skin_tone as SkinToneKey) ?? DEFAULT_SKIN_TONE
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
 
  const form = useForm<EditCharacterFormValues>({
    resolver: zodResolver(editCharacterSchema),
    defaultValues: {
      title: character.title,
      icon: character.icon.value,
      iconType: character.icon.type,
      iconColor: character.icon.color,
      color_theme: character.color_theme,
      description: character.description || '',
    },
  })

  // Reset all local state whenever the character prop changes
  useEffect(() => {
    const latestAvatar = character.avatar as CharacterAvatarData | null
    const latestIcon   = character.icon   as IconData
 
    form.reset({
      title:       character.title,
      icon:        character.icon.value,
      iconType:    character.icon.type,
      iconColor:   character.icon.color,
      color_theme: character.color_theme,
      description: character.description || '',
    })
 
    setIcon(latestIcon)
    setSelectedArchetype(latestAvatar?.archetype_id ?? null)
    setSkinTone((latestAvatar?.skin_tone as SkinToneKey) ?? DEFAULT_SKIN_TONE)
  }, [character, form])

  const selectedColor = form.watch('color_theme')

  function handleIconChange(value: string, type: IconType, color?: string) {
    setIcon({ type, value, color })
    form.setValue('icon',      value)
    form.setValue('iconType',  type)
    form.setValue('iconColor', color ?? '')
  }

  async function onSubmit(values: EditCharacterFormValues) {
    setIsSubmitting(true)
    try {
      const avatar: CharacterAvatarData | null = selectedArchetype
        ? { archetype_id: selectedArchetype, skin_tone: skinTone }
        : null
 
      const result = await updateCharacter({
        id: character.id,
        title: values.title,
        color_theme: values.color_theme,
        icon: values.icon ?? character.icon.value,
        icon_type: values.iconType ?? character.icon.type,
        icon_color: values.iconColor ?? character.icon.color,
        description: values.description || undefined,
        avatar,
      })
 
      if (!result.success) {
        if (result.error.includes('title')) {
          form.setError('title', { message: result.error })
        } else if (result.error.includes('color')) {
          form.setError('color_theme', { message: result.error })
        } else {
          toast.error(result.error)
        }
        return
      }
 
      toast.success(`${values.title} has been updated.`)
      onCharacterUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating character:', error)
      toast.error('Failed to update character. Please try again.')
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
 
                {/* Preset palette */}
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
 
                {/* Custom color row */}
                <div className="flex items-center gap-3">
                  {/* Native colour wheel */}
                  <div className="relative w-9 h-9 shrink-0">
                    <div
                      className="w-9 h-9 rounded-full border-2 border-border cursor-pointer overflow-hidden"
                      style={{ backgroundColor: selectedColor }}
                    >
                      <input
                        type="color"
                        value={selectedColor}
                        onChange={(e) =>
                          form.setValue('color_theme', e.target.value, { shouldValidate: true })
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Pick a custom colour"
                      />
                    </div>
                  </div>
 
                  {/* Hex text input */}
                  <Input
                    value={selectedColor}
                    onChange={(e) => {
                      const raw = e.target.value.trim()
                      const withHash = raw.startsWith('#') ? raw : `#${raw}`
                      form.setValue('color_theme', withHash, { shouldValidate: true })
                    }}
                    maxLength={7}
                    className="font-mono text-sm w-32"
                    placeholder="#6366f1"
                  />
 
                  <span className="text-sm text-muted-foreground">
                    {COLOR_PALETTE.find(c => c.hex === selectedColor)?.label ?? 'Custom'}
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
                  {AVATAR_REGISTRY.map((archetype) => {
                    const isLocked   = archetype.lockedUntilLevel
                      ? character.level < archetype.lockedUntilLevel
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
                          'relative flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-xs overflow-hidden',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/40 hover:bg-muted/40',
                          isLocked && 'opacity-40 cursor-not-allowed hover:border-border hover:bg-transparent'
                        )}
                      >
                        <AvatarRenderer
                          archetypeId={archetype.id}
                          skinTone={skinTone}
                          size={48}
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
 
              {/* Skin tone + preview — only when an archetype is selected */}
              {selectedArchetype && (
                <div className="space-y-3">
                  <Label>Skin Tone</Label>
                  <div className="flex gap-2">
                    {(Object.keys(SKIN_TONES) as SkinToneKey[]).map((key) => (
                      <button
                        key={key}
                        type="button"
                        title={SKIN_TONE_LABELS[key]}
                        onClick={() => setSkinTone(key)}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          skinTone === key
                            ? 'border-foreground scale-110 shadow-md'
                            : 'border-transparent hover:scale-105'
                        )}
                        style={{ backgroundColor: SKIN_TONES[key].base }}
                      />
                    ))}
                  </div>
 
                  {/* Live preview */}
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30">
                      <div
                        className="rounded-xl shadow-sm border overflow-hidden shrink-0"
                        style={{
                          backgroundColor: selectedColor + '22',
                          borderColor:     selectedColor + '66',
                        }}
                      >
                        <AvatarRenderer
                          archetypeId={selectedArchetype}
                          skinTone={skinTone}
                          size={64}
                        />
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium capitalize">
                          {AVATAR_REGISTRY.find(a => a.id === selectedArchetype)?.label}
                        </p>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: SKIN_TONES[skinTone]?.base }}
                          />
                          <span className="text-muted-foreground text-xs">
                            {SKIN_TONE_LABELS[skinTone]} skin
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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