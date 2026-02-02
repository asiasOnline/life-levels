import React from 'react'
import SearchBar from '@/components/layout/search-bar'
import FilterButton from '@/components/layout/filter-button'
import SortButton from '@/components/layout/sort-button'
import LayoutViewButton from '@/components/layout/layout-view-button'
import Task from './task'

const TaskContainer = () => {
  return (
    <div className='bg-white w-250'>
      <div className='py-4 mx-4 flex justify-between border-b'>
        <h3 className='text-lg text-muted-foreground'>Task Log</h3>
        <SearchBar />
        <div className='flex justify-center gap-2'>
          <FilterButton />
          <SortButton />
          <LayoutViewButton />
        </div>
      </div>
      <div className='flex justify-center'>
        <Task />
        <Task />
        <Task />
      </div>
    </div>
  )
}

export default TaskContainer