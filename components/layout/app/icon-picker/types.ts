export type IconType = 'emoji' | 'icon' | 'image';

export interface IconData {
    icon: string //Emoji character, Icon name, or Image URL
    iconType: IconType
    iconColor?: string // Hex color for icons
}

// Default Values
export const DEFAULT_ICON = 'FaCircleArrowUp'
export const DEFAULT_ICON_TYPE: IconType = 'icon'
export const DEFAULT_ICON_COLOR = '#3b82f6'