import { getAvatarById, type AvatarProps } from './avatar-registry'

type Props = AvatarProps & {
  archetypeId: string
  fallback?: React.ReactNode
  size?: number
}

export const AvatarRenderer: React.FC<Props> = ({
  archetypeId,
  skinTone,
  clothingColor,
  size = 96,
  className,
  fallback = null,
}) => {
  const archetype = getAvatarById(archetypeId)
  
  if (!archetype) return <>{fallback}</>
  
  const Component = archetype.component
  return (
    <div style={{ width: size, height: size, minWidth: size, minHeight: size }} 
    className='overflow-hidden shrink-0'>
      <Component
        skinTone={skinTone}
        clothingColor={clothingColor}
        className="w-full h-full block"
      />
    </div>
  )
}