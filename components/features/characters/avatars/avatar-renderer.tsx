import { getAvatarById, type AvatarProps } from './avatar-registry'

type AvatarRenderProps = AvatarProps & {
  archetypeId: string;
  fallback?: React.ReactNode;
  size?: number;
  className?: string;
  // Fill color for single-color avatars. `fill` is an inherited SVG property, so
  // setting it on the wrapper colors every path that doesn't set its own fill.
  color?: string;
}

export const AvatarRenderer: React.FC<AvatarRenderProps> = ({
  archetypeId,
  size = 96,
  className,
  color,
  fallback = null,
}) => {
  const archetype = getAvatarById(archetypeId)
  if (!archetype) return <>{fallback}</>

  const AvatarComponent = archetype.component

  return (
    <div style={{
      width: size,
      height: size,
      minWidth: size,
      minHeight: size,
      fill: color }}
    className='overflow-hidden shrink-0'>
      <AvatarComponent
        className="w-full h-full block"
      />
    </div>
  )
}
