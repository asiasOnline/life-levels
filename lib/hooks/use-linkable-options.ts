'use client'

import { useEffect, useState } from 'react'
import { fetchSkills } from '@/lib/actions/skills'
import { fetchCharacters } from '@/lib/actions/characters'
import { SkillSummary } from '@/lib/types/skills'
import { CharacterSummary } from '@/lib/types/character'

// Skills and (non-archived) characters that an item can be linked to.
// Needed by the edit modals when they are opened from a detail page.
export function useLinkableOptions() {
  const [availableSkills, setAvailableSkills] = useState<SkillSummary[]>([])
  const [availableCharacters, setAvailableCharacters] = useState<CharacterSummary[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const [skillsResult, charactersResult] = await Promise.all([
        fetchSkills(),
        fetchCharacters(),
      ])
      if (cancelled) return

      if (skillsResult.success) {
        setAvailableSkills(
          skillsResult.data.map((s) => ({
            id: s.id,
            title: s.title,
            icon: s.icon,
            level: s.level,
          }))
        )
      }
      if (charactersResult.success) {
        setAvailableCharacters(
          charactersResult.data
            .filter((c) => !c.is_archived)
            .map((c) => ({
              id: c.id,
              title: c.title,
              icon: c.icon,
              character_color: c.character_color,
              level: c.level,
            }))
        )
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { availableSkills, availableCharacters }
}
