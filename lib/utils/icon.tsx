import * as FaIcons from 'react-icons/fa6'
import { IconType } from 'react-icons'

// Popular icons for the system
export const AVAILABLE_ICONS = [
  'FaCircleArrowUp', 'FaStar', 'FaTrophy', 'FaFire', 'FaBolt',
  'FaHeart', 'FaBrain', 'FaDumbbell', 'FaBook', 'FaCode',
  'FaPalette', 'FaMusic', 'FaGamepad', 'FaCamera', 'FaPenNib',
  'FaRocket', 'FaLightbulb', 'FaGem', 'FaCrown', 'FaShield',
  'FaSwords', 'FaWandMagicSparkles', 'FaMountain', 'FaLeaf', 'FaSeedling', 'FaCoins', 'FaChartLine', 'FaGraduationCap', 'FaMedal', 'FaAward', 'FaSquareCheck', 'FaRotate', 'FaFolder', 'FaBullseye', 'FaFlag',
] as const

export type AvailableIconName = typeof AVAILABLE_ICONS[number]

/**
 * Get icon component by name
 */
export function getIconComponent(iconName: string): IconType | null {
  const IconComponent = (FaIcons as any)[iconName]
  return IconComponent || null
}

/**
 * Render icon based on type - works for any feature
 */
export function renderIcon(
  icon: string | undefined,
  iconType: string,
  iconColor: string | undefined,
  className?: string
): React.ReactNode {
  if (iconType === 'emoji') {
    return <span className={className}>{icon || '⭐'}</span>
  }
  
  if (iconType === 'icon') {
    const IconComponent = getIconComponent(icon || 'FaCircleArrowUp')
    if (IconComponent) {
      return <IconComponent className={className} style={{ color: iconColor }} />
    }
  }
  
  if (iconType === 'image' && icon) {
    return (
      <img 
        src={icon} 
        alt="Icon" 
        className={className}
        style={{ objectFit: 'cover' }}
      />
    )
  }
  
  // Fallback
  const FallbackIcon = FaIcons.FaCircleArrowUp
  return <FallbackIcon className={className} style={{ color: iconColor }} />
}