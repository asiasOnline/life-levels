import React from 'react'
import SearchBar from '@/components/layout/search-bar'
import NewSkillButton from './new-skill-button'
import FilterButton from '@/components/layout/filter-button'
import SortButton from '@/components/layout/sort-button'
import LayoutViewButton from '@/components/layout/layout-view-button'
import Skill from './skill'

const SkillContainer = () => {
  return (
    <div className='w-260 rounded-lg border bg-card'>
        <div className='py-4 mx-4 flex justify-between'>
        <div className='flex gap-10'>
          <div className='flex items-center'>
            <h3 className='font-medium text-muted-foreground'>Skill Log</h3>
          </div>
          <div className='w-120'>
            <SearchBar />
          </div>
        </div>
        <div className='flex justify-center gap-2'>
          <NewSkillButton />
          <FilterButton />
          <SortButton />
          <LayoutViewButton />
        </div>
        </div>
        <hr />
        <div className='flex justify-center'>
            <Skill />
            <Skill />
            <Skill />
        </div>
    </div>
  )
}

export default SkillContainer