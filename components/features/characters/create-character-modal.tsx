'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Field,
  FieldDescription,
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
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { IconPicker } from '@/components/layout/app/icon-picker'
import { 
  IconType, 
  DEFAULT_ICON, 
  DEFAULT_ICON_TYPE, 
  DEFAULT_ICON_COLOR, 
  DEFAULT_ICON_DATA
} from "@/lib/types/icon"
import { AVATAR_REGISTRY } from './avatars/avatar-registry'
import { AvatarRenderer } from './avatars/avatar-renderer'
import { 
  CharacterAvatarData, 
  CreateCharacterInput,
  SKIN_TONES, 
  SkinToneKey,
  DEFAULT_SKIN_TONE,
 } from '@/lib/types/character'
import { createCharacter } from '@/lib/actions/characters'
import { cn } from '@/lib/utils/general'
import { SkillSummary } from '@/lib/types/skills'
import { toast } from "sonner" 

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

const SKIN_TONE_LABELS: Record<SkinToneKey, string> = {
  light:      'Light',
  mediumLight: 'Medium Light',
  medium:     'Medium',
  mediumDark: 'Medium Dark',
  deep:       'Deep',
}

// =======================================
// SCHEMA
// =======================================

const createCharacterSchema = z.object({
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
  skillIds: z
    .array(z.string())
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
// MAIN COMPONENT
// =======================================

export function CreateCharacterModal({
  isOpen,
  onClose,
  onCharacterCreated,
  characterLevel = 1,
}: CreateCharacterModalProps) {
  const [activeTab, setActiveTab] = useState<'basics' | 'avatar'>('basics')
  const [selectedArchetype, setSelectedArchetype] = useState<string | null>(null)
  const [skinTone, setSkinTone] = useState<SkinToneKey>(DEFAULT_SKIN_TONE)
  const [skills, setSkills] = useState<SkillSummary[]>([])
  const [isLoadingSkills, setIsLoadingSkills] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<CreateCharacterFormValues>({
    resolver: zodResolver(createCharacterSchema),
    defaultValues: {
      title: '',
      icon: DEFAULT_ICON,
       iconType: DEFAULT_ICON_TYPE as 'emoji' | 'fontawesome' | 'image',
      iconColor: DEFAULT_ICON_COLOR,
      color_theme: COLOR_PALETTE[0].hex,
      description: '',
      skillIds: [],
    },
  })

  const selectedColor = form.watch('color_theme')
  const selectedSkillIds = form.watch('skillIds')

  // Load skills on mount
    useEffect(() => {
      loadSkills()
    }, [])

  async function loadSkills() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('skills')
        .select('id, title, icon, level')
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

  function handleClose() {
    form.reset()
    setSelectedArchetype(null)
   setSkinTone(DEFAULT_SKIN_TONE)
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

  function toggleSkill(id: string) {
    const current = form.getValues('skillIds')
    form.setValue(
      'skillIds',
      current.includes(id) ? current.filter((s) => s !== id) : [...current, id]
    )
  }

  async function onSubmit(values: CreateCharacterFormValues) {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const avatar: CharacterAvatarData | null = selectedArchetype
        ? {
            archetype_id:   selectedArchetype,
            skin_tone:      skinTone,
          }
        : null

      const input: CreateCharacterInput = {
        title: values.title,
        color_theme: values.color_theme,
        icon: values.icon || DEFAULT_ICON_DATA.value,
        icon_type: values.iconType,
        icon_color: values.iconColor,
        description: values.description || undefined,
        avatar,
        skill_ids: values.skillIds,
      }

      const result = await createCharacter(input)

      if (!result.success) {
        if (result.error.includes('title')) {
          form.setError('title', { message: result.error })
        } else if (result.error.includes('color')) {
          form.setError('color_theme', { message: result.error })
        } else {
          setSubmitError(result.error)
        }
        return
      }

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

// =======================================
// COMPONENT RENDER
// =======================================

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-5/6 sm:max-w-140 lg:max-w-240 max-h-[90vh] overflow-y-auto">
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
                <FieldLabel htmlFor="chararcter-icon">Icon</FieldLabel>
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
                {/* Preset Palette Colors */}
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      title={color.label}
                      onClick={() => {
                        form.setValue('color_theme', color.hex, { shouldValidate: true })
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
                      // Always keep the leading # while typing
                      const withHash = raw.startsWith('#') ? raw : `#${raw}`
                      form.setValue('color_theme', withHash, { shouldValidate: true })
                    }}
                    maxLength={7}
                    className="font-mono text-sm w-32"
                    placeholder="#6366f1"
                  />

                  {/* Live swatch label */}
                  <span className="text-sm text-muted-foreground">
                    {COLOR_PALETTE.find(c => c.hex === selectedColor)?.label ?? 'Custom'}
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

              {/* Skills */}
              <Field>
                <FieldLabel>Link to Skills</FieldLabel>
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
                      selectedSkillIds.includes(skill.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <Checkbox
                      checked={selectedSkillIds.includes(skill.id)}
                      onCheckedChange={() => toggleSkill(skill.id)}
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
                <FieldDescription>
                  Select skills this character is associated with.
                </FieldDescription>
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

              {/* Skin Tone */}
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
                          style={{ backgroundColor: SKIN_TONES[key].base }}  // ← use .base for display
                        />
                      ))}
                    </div>
                  </div>

              {/* Customization — only shown if an archetype is selected */}
              {selectedArchetype && (
                <>

                  {/* Live Avatar Preview */}
                  <Field>
                    <FieldLabel>Preview</FieldLabel>
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center shadow-sm border overflow-hidden"
                      style={{
                        backgroundColor: selectedColor + '22',
                        borderColor: selectedColor + '66',
                      }}
                    >
                      {selectedArchetype && (
                        <AvatarRenderer
                          archetypeId={selectedArchetype}
                          skinTone={skinTone}
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
                            {SKIN_TONE_LABELS[skinTone]} skin
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