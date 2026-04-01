'use client'

import { useState, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Upload, Palette, Search, X } from 'lucide-react'
import { AVAILABLE_ICONS, getIconComponent, renderIcon } from '@/lib/utils/icon'
import { IconType, DEFAULT_ICON_COLOR } from '@/lib/types/icon'
import { cn } from '@/lib/utils/general'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'

interface IconPickerProps {
  currentIcon?: string
  currentIconType?: IconType
  currentIconColor?: string
  onIconChange: (icon: string, iconType: IconType, iconColor?: string) => void
  /** Label shown above the trigger button. Defaults to "Icon" */
  label?: string
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // green
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
]

const RECENT_ICONS_KEY = 'icon-picker-recent'
const MAX_RECENT = 10

function getRecentIcons(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_ICONS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function pushRecentIcon(iconName: string) {
  if (typeof window === 'undefined') return
  const recent = getRecentIcons().filter((i) => i !== iconName)
  recent.unshift(iconName)
  localStorage.setItem(RECENT_ICONS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

export function IconPicker({
  currentIcon,
  currentIconType = 'fontawesome',
  currentIconColor = DEFAULT_ICON_COLOR,
  onIconChange,
  label = 'Icon',
}: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState<IconType>(currentIconType)
  const [selectedColor, setSelectedColor] = useState(currentIconColor)
  const [customColor, setCustomColor] = useState(currentIconColor)
  const [imagePreview, setImagePreview] = useState<string | null>(
    currentIconType === 'image' && currentIcon ? currentIcon : null
  )
  const [iconSearch, setIconSearch] = useState('')
  const [recentIcons, setRecentIcons] = useState<string[]>(getRecentIcons)

  const hasIcon =
    !!currentIcon && currentIcon !== '' && currentIconType !== undefined

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onIconChange(emojiData.emoji, 'emoji', undefined)
    setOpen(false)
  }

  const handleIconClick = useCallback(
    (iconName: string) => {
      onIconChange(iconName, 'fontawesome', selectedColor)
      pushRecentIcon(iconName)
      setRecentIcons(getRecentIcons())
      setOpen(false)
    },
    [onIconChange, selectedColor]
  )

  const handleColorChange = (color: string) => {
    setSelectedColor(color)
    setCustomColor(color)
    if (currentIconType === 'fontawesome' && currentIcon) {
      onIconChange(currentIcon, 'fontawesome', color)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setImagePreview(base64String)
      onIconChange(base64String, 'image', undefined)
      setOpen(false)
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = () => {
    setImagePreview(null)
    onIconChange('', 'fontawesome', selectedColor)
    setOpen(false)
  }

  const filteredIcons = iconSearch
    ? AVAILABLE_ICONS.filter((name) =>
        name.toLowerCase().includes(iconSearch.toLowerCase())
      )
    : AVAILABLE_ICONS

  return (
    <div className="flex flex-col items-center gap-1.5">

      <span className="text-xs text-muted-foreground">{label}</span>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'group relative flex items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200',
          'w-16 h-16',
          hasIcon
            ? 'border-border bg-muted/40 hover:border-primary/60 hover:bg-muted/70'
            : 'border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/40'
        )}
        aria-label={`${label}: ${hasIcon ? 'change icon' : 'choose icon'}`}
      >
        {hasIcon ? (
          <>
            <div className="flex items-center justify-center w-10 h-10">
              {renderIcon(currentIcon, currentIconType, currentIconColor, 'w-8 h-8')}
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
              <Palette className="w-4 h-4 text-muted-foreground" />
            </div>
          </>
        ) : (
          <Palette className="w-5 h-5 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground" />
        )}
      </button>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-105 p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4 pb-3 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-semibold">Choose Icon</DialogTitle>
              {hasIcon && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={handleRemove}
                >
                  <X className="w-3 h-3 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          </DialogHeader>

          <Tabs
            value={selectedTab}
            onValueChange={(v) => setSelectedTab(v as IconType)}
            className="w-full flex flex-col"
          >
            <TabsList className="w-full rounded-none border-b h-10 bg-transparent px-4 justify-start gap-1">
              <TabsTrigger
                value="emoji"
                className="rounded-md h-8 px-3 text-xs data-[state=active]:bg-muted"
              >
                Emoji
              </TabsTrigger>
              <TabsTrigger
                value="fontawesome"
                className="rounded-md h-8 px-3 text-xs data-[state=active]:bg-muted"
              >
                Icons
              </TabsTrigger>
              <TabsTrigger
                value="image"
                className="rounded-md h-8 px-3 text-xs data-[state=active]:bg-muted"
              >
                Upload
              </TabsTrigger>
            </TabsList>

            {/* Emoji Tab */}
            <TabsContent value="emoji" className="m-0">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width="100%"
                height={380}
                previewConfig={{ showPreview: false }}
              />
            </TabsContent>

            {/* Icons Tab */}
            <TabsContent value="fontawesome" className="m-0 flex flex-col">
              {/* Search */}
              <div className="px-4 pt-3 pb-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter..."
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </div>

              <ScrollArea className="h-80">
                <div className="px-4 pb-4 space-y-4">
                  {/* Recent */}
                  {!iconSearch && recentIcons.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Recent</p>
                      <div className="grid grid-cols-8 gap-1.5">
                        {recentIcons.map((iconName) => {
                          const IconComponent = getIconComponent(iconName)
                          if (!IconComponent) return null
                          return (
                            <IconButton
                              key={iconName}
                              iconName={iconName}
                              IconComponent={IconComponent}
                              isSelected={
                                currentIcon === iconName &&
                                currentIconType === 'fontawesome'
                              }
                              color={selectedColor}
                              onClick={handleIconClick}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* All icons */}
                  <div>
                    {!iconSearch && (
                      <p className="text-xs font-medium text-muted-foreground mb-2">Icons</p>
                    )}
                    {filteredIcons.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        No icons match "{iconSearch}"
                      </p>
                    ) : (
                      <div className="grid grid-cols-8 gap-1.5">
                        {filteredIcons.map((iconName) => {
                          const IconComponent = getIconComponent(iconName)
                          if (!IconComponent) return null
                          return (
                            <IconButton
                              key={iconName}
                              iconName={iconName}
                              IconComponent={IconComponent}
                              isSelected={
                                currentIcon === iconName &&
                                currentIconType === 'fontawesome'
                              }
                              color={selectedColor}
                              onClick={handleIconClick}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>

              {/* Color selector — pinned to bottom */}
              <div className="border-t px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">Color</span>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={cn(
                          'w-5 h-5 rounded-full border-2 transition-all',
                          selectedColor === color
                            ? 'border-foreground scale-110'
                            : 'border-transparent hover:scale-105'
                        )}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorChange(color)}
                      />
                    ))}
                    {/* Custom color swatch */}
                    <div
                      className="relative w-5 h-5 rounded-full overflow-hidden border-2 border-border cursor-pointer"
                      title="Custom color"
                    >
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div
                        className="w-full h-full rounded-full"
                        style={{ backgroundColor: customColor }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Upload Tab */}
            <TabsContent value="image" className="m-0 p-4">
              <div className="border-2 border-dashed rounded-xl p-8 text-center">
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-24 h-24 mx-auto rounded-xl object-cover"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImagePreview(null)
                        onIconChange('', 'fontawesome', selectedColor)
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a custom image
                      <br />
                      <span className="text-xs">PNG, JPG, GIF, SVG · max 2MB</span>
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="max-w-50 mx-auto text-xs"
                    />
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// -----------------------------------------
// Small helper sub-component for icon grid buttons
// -----------------------------------------
interface IconButtonProps {
  iconName: string
  IconComponent: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  isSelected: boolean
  color: string
  onClick: (iconName: string) => void
}

function IconButton({ iconName, IconComponent, isSelected, color, onClick }: IconButtonProps) {
  return (
    <button
      type="button"
      title={iconName}
      onClick={() => onClick(iconName)}
      className={cn(
        'flex items-center justify-center rounded-lg p-1.5 transition-all hover:scale-110',
        isSelected
          ? 'bg-accent ring-2 ring-primary ring-offset-1'
          : 'hover:bg-muted'
      )}
    >
      <IconComponent className="w-4 h-4" style={{ color }} />
    </button>
  )
}