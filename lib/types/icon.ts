export type IconType = 'emoji' | 'fontawesome' | 'image';

export interface IconData {
    type: IconType // Icon variant
    value: string        // Emoji character, icon name, or image URL
    color?: string       // Hex color (used for fontawesome icons)
}

// Default Values
export const DEFAULT_ICON = 'FaCircleArrowUp'
export const DEFAULT_ICON_TYPE: IconType = 'fontawesome'
export const DEFAULT_ICON_COLOR = '#3b82f6'
export const DEFAULT_ICON_DATA: IconData = { type: DEFAULT_ICON_TYPE, value: DEFAULT_ICON, color: DEFAULT_ICON_COLOR }
