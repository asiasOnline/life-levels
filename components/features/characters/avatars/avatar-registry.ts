import { Aphrodite } from "./mythology/aphrodite"
import { Artemis } from "./mythology/artemis"
import { Athena } from "./mythology/athena"
import { Chiron } from "./mythology/chiron"
import { Cyclops } from "./mythology/cyclops"
import { Demeter } from "./mythology/demeter"
import { Hephaestus } from "./mythology/hephaestus"
import { Hercules } from "./mythology/hercules"
import { Prometheus } from "./mythology/prometheus"
import { Themis } from "./mythology/themis"
import { Zeus } from "./mythology/zeus"
import { Knight } from "./rpg/knight"
import { SkinToneKey } from "@/lib/types/character"

export type AvatarProps = {
  skinTone: SkinToneKey    // hex color
  className?: string
}

export type AvatarArchetype = {
  id: string
  label: string 
  component: React.FC<AvatarProps>
  tags: string[]      // e.g. ["strength", "combat"] — useful for filtering later
  lockedUntilLevel?: number  // for milestone-locked avatars per your PRD
}

export const AVATAR_REGISTRY: AvatarArchetype[] = [
    {
    id: 'aphrodite',
    label: 'Aphrodite',
    component: Aphrodite,
    tags: ['intellect', 'courage', 'leadership', 'strategy'],
  },
  {
    id: 'artemis',
    label: 'Artemis',
    component: Artemis,
    tags: ['hunt', 'wilderness', 'nature', 'chastity'],
  },
    {
    id: 'athena',
    label: 'Athena',
    component: Athena,
    tags: ['knowledge', 'creative'],
  },
  {
    id: 'chiron',
    label: 'Chiron',
    component: Chiron,
    tags: ['wisdom', 'medicine', 'mentorship', 'harmony'],
  },
  {
    id: 'cyclops',
    label: 'Cyclops',
    component: Cyclops,
    tags: ['primal', 'power', 'raw', 'chaos'],
  },
  {
    id: 'demeter',
    label: 'Demeter',
    component: Demeter,
    tags: ['agriculture', 'gardening', 'fertility', 'harvest'],
  },
  {
    id: 'hephaestus',
    label: 'Hephaestus',
    component: Hephaestus,
    tags: ['skillful', 'creative', 'manufacturing', 'craftsmanship'],
  },
  {
    id: 'hercules',
    label: 'Hercules',
    component: Hercules,
    tags: ['strength', 'perserverance', 'heroism', 'potential'],
  },
  {
    id: 'prometheus',
    label: 'Prometheus',
    component: Prometheus,
    tags: ['rebellious', 'defiance', 'progress', 'enlightenment'],
  },
  {
    id: 'themis',
    label: 'Themis',
    component: Themis,
    tags: ['justice', 'respect', 'order', 'balance'],
  },
  {
    id: 'zeus',
    label: 'Zeus',
    component: Zeus,
    tags: ['power', 'authority', 'enforcement', 'decisiveness'],
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