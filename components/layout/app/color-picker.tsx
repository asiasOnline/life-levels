'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/general'

export const COLOR_PALETTE = [
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

export const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
  className?: string
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const label = COLOR_PALETTE.find((c) => c.hex.toLowerCase() === value.toLowerCase())?.label ?? 'Custom'

  return (
    <div className={cn('space-y-3', className)}>
      {/* Preset palette */}
      <div className="flex flex-wrap gap-2">
        {COLOR_PALETTE.map((color) => (
          <button
            key={color.hex}
            type="button"
            title={color.label}
            aria-label={color.label}
            onClick={() => onChange(color.hex)}
            className={cn(
              'w-8 h-8 rounded-full border-2 transition-all',
              value.toLowerCase() === color.hex
                ? 'border-foreground scale-110 shadow-md'
                : 'border-transparent hover:scale-105'
            )}
            style={{ backgroundColor: color.hex }}
          />
        ))}
      </div>

      {/* Custom color */}
      <div className="flex items-center gap-3">
        <div className="relative w-9 h-9 shrink-0">
          <div
            className="w-9 h-9 rounded-full border-2 border-border cursor-pointer overflow-hidden"
            style={{ backgroundColor: HEX_COLOR_REGEX.test(value) ? value : undefined }}
          >
            <input
              type="color"
              value={HEX_COLOR_REGEX.test(value) ? value : '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Pick a custom color"
            />
          </div>
        </div>

        <Input
          value={value}
          onChange={(e) => {
            const raw = e.target.value.trim()
            // Always keep the leading # while typing
            onChange(raw.startsWith('#') ? raw : `#${raw}`)
          }}
          maxLength={7}
          className="font-mono text-sm w-32"
          placeholder="#6366f1"
        />

        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}
