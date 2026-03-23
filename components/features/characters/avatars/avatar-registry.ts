import { ThunderGod } from "./mythology/thunder-god"
import { WisdomGoddess } from "./mythology/wisdom-goddess"
import { Knight } from "./rpg/knight"

export type AvatarProps = {
  skinTone: string    // hex color
  clothingColor: string  // hex color
  className?: string
}

export type AvatarArchetype = {
  id: string
  label: string       // "Warrior", "Scholar", etc.
  component: React.FC<AvatarProps>
  tags: string[]      // e.g. ["strength", "combat"] — useful for filtering later
  lockedUntilLevel?: number  // for milestone-locked avatars per your PRD
}

export const AVATAR_REGISTRY: AvatarArchetype[] = [
  {
    id: 'thunder-god',
    label: 'Thunder God',
    component: ThunderGod,
    tags: ['strength', 'physical'],
  },
  {
    id: 'wisdom-goddess',
    label: 'Wisdom Goddess',
    component: WisdomGoddess,
    tags: ['knowledge', 'creative'],
  },
  {
    id: 'knight',
    label: 'Knight',
    component: Knight,
    tags: ['adventure', 'travel'],
    lockedUntilLevel: 5,
  },
  // ...
]

export const getAvatarById = (id: string) =>
  AVATAR_REGISTRY.find(a => a.id === id)