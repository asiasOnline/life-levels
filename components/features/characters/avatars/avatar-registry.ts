import { Aphrodite } from "./mythology/aphrodite"
import { Apollo } from "./mythology/apollo"
import { Ares } from "./mythology/ares"
import { Artemis } from "./mythology/artemis"
import { Athena } from "./mythology/athena"
import { Centaur } from "./mythology/centaur"
import { Chiron } from "./mythology/chiron"
import { Cyclops } from "./mythology/cyclops"
import { Demeter } from "./mythology/demeter"
import { Hephaestus } from "./mythology/hephaestus"
import { Hercules } from "./mythology/hercules"
import { Hermes } from "./mythology/hermes"
import { Hydra } from "./mythology/hydra"
import { Nike } from "./mythology/nike"
import { Prometheus } from "./mythology/prometheus"
import { Themis } from "./mythology/themis"
import { Zeus } from "./mythology/zeus"
import { Knight } from "./rpg/knight"

export type AvatarProps = {
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
    id: 'apollo',
    label: 'Apollo',
    component: Apollo,
    tags: ['intellect', 'courage', 'leadership', 'strategy'],
  },
  {
    id: 'ares',
    label: 'Ares',
    component: Ares,
    tags: ['battle', 'powerful', 'combat', 'physical'],
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
    id: 'centaur',
    label: 'Centaur',
    component: Centaur,
    tags: ['wisdom', 'medicine', 'mentorship', 'harmony'],
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
    id: 'hermes',
    label: 'Hermes',
    component: Hermes,
    tags: ['strength', 'perserverance', 'heroism', 'potential'],
  },
  {
    id: 'hydra',
    label: 'Hydra',
    component: Hydra,
    tags: ['resilience', 'regeneration', 'persistence', 'monster'],
  },
  {
    id: 'nike',
    label: 'Nike',
    component: Nike,
    tags: ['victory', 'triumph', 'contests', 'discipline'],
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