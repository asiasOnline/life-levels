import { getAvatarById, type AvatarProps } from './avatar-registry'
import { SkinToneKey, DEFAULT_SKIN_TONE, SKIN_TONES } from '@/lib/types/character'

type AvatarRenderProps = AvatarProps & {
  archetypeId: string;
  fallback?: React.ReactNode;
  size?: number;
  className?: string;
  skinTone?: SkinToneKey;
}

export const AvatarRenderer: React.FC<AvatarRenderProps> = ({
  archetypeId,
  skinTone = DEFAULT_SKIN_TONE,
  size = 96,
  className,
  fallback = null,
}) => {
  const archetype = getAvatarById(archetypeId)
  if (!archetype) return <>{fallback}</>
  
  const AvatarComponent = archetype.component

  const skinToneGuard: SkinToneKey = 
        skinTone && skinTone in SKIN_TONES 
          ? skinTone 
          : DEFAULT_SKIN_TONE
  
  return (
    <div style={{ 
      width: size, 
      height: size, 
      minWidth: size, 
      minHeight: size }} 
    className='overflow-hidden shrink-0'>
      <AvatarComponent
        skinTone={skinToneGuard}
        className="w-full h-full block"
      />
    </div>
  )
}