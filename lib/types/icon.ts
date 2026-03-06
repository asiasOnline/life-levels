export type IconType = 'emoji' | 'fontawesome' | 'image';

export interface IconData {
    icon: string //Emoji character, Icon name, or Image URL
    icon_type: IconType
    icon_color?: string // Hex color for icons
}

// Default Value
export const DEFAULT_ICON = {type: "fontawesome", color: "#3b82f6", value: 'FaCircleArrowUp'}
