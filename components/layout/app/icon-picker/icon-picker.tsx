'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Upload, Palette } from 'lucide-react'
import { AVAILABLE_ICONS, getIconComponent, renderIcon } from './icon-utils'
import { IconType, DEFAULT_ICON_COLOR } from './types'
import { cn } from '@/lib/utils'
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'

interface IconPickerProps {
  currentIcon?: string
  currentIconType?: IconType
  currentIconColor?: string
  onIconChange: (icon: string, iconType: IconType, iconColor?: string) => void
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

export function IconPicker({
  currentIcon,
  currentIconType = 'icon',
  currentIconColor = DEFAULT_ICON_COLOR,
  onIconChange,
}: IconPickerProps) {
  const [selectedTab, setSelectedTab] = useState<IconType>(currentIconType)
  const [selectedColor, setSelectedColor] = useState(currentIconColor)
  const [customColor, setCustomColor] = useState(currentIconColor)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onIconChange(emojiData.emoji, 'emoji', undefined)
  }

  const handleIconClick = (iconName: string) => {
    onIconChange(iconName, 'icon', selectedColor)
  }

  const handleColorChange = (color: string) => {
    setSelectedColor(color)
    setCustomColor(color)
    if (currentIconType === 'icon' && currentIcon) {
      onIconChange(currentIcon, 'icon', color)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setImagePreview(base64String)
      onIconChange(base64String, 'image', undefined)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as IconType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="emoji">Emoji</TabsTrigger>
          <TabsTrigger value="icon">Icons</TabsTrigger>
          <TabsTrigger value="image">Upload</TabsTrigger>
        </TabsList>

        {/* Emoji Tab */}
        <TabsContent value="emoji" className="space-y-4">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width="100%"
            height={350}
            previewConfig={{ showPreview: false }}
          />
        </TabsContent>

        {/* Icons Tab */}
        <TabsContent value="icon" className="space-y-4">
          {/* Color Selector */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Icon Color
            </Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    'w-8 h-8 rounded-full border-2 transition-all',
                    selectedColor === color
                      ? 'border-primary scale-110'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                />
              ))}
              <div className="relative">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded-full cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Icon Grid */}
          <ScrollArea className="h-[300px] border rounded-lg p-4">
            <div className="grid grid-cols-5 gap-3">
              {AVAILABLE_ICONS.map((iconName) => {
                const IconComponent = getIconComponent(iconName)
                if (!IconComponent) return null

                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => handleIconClick(iconName)}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all hover:scale-110',
                      currentIcon === iconName && currentIconType === 'icon'
                        ? 'border-primary bg-accent'
                        : 'border-transparent hover:border-muted-foreground/20'
                    )}
                  >
                    <IconComponent
                      className="w-6 h-6 mx-auto"
                      style={{ color: selectedColor }}
                    />
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="image" className="space-y-4">
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 mx-auto rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setImagePreview(null)
                      onIconChange('FaCircleArrowUp', 'icon', selectedColor)
                    }}
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a custom image (max 2MB)
                  </p>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="max-w-xs mx-auto"
                  />
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Supported formats: PNG, JPG, GIF, SVG
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
        <span className="text-sm font-medium">Preview:</span>
        <div className="w-10 h-10 flex items-center justify-center">
          {renderIcon(
            currentIcon,
            currentIconType,
            currentIconColor,
            'w-8 h-8'
          )}
        </div>
      </div>
    </div>
  )
}