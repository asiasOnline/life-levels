import React from 'react'
import SearchBar from '@/components/layout/nav/search-bar'
import NewTaskButton from './new-task-button'
import FilterButton from '@/components/layout/filter-button'
import SortButton from '@/components/layout/sort-button'
import LayoutViewButton from '@/components/layout/layout-view-button'
import Task from './task'


const TaskContainer = () => {
  return (
    <div className='w-260 rounded-lg border bg-card'>
      <div className='py-4 mx-4 flex justify-between'>
        <div className='flex gap-10'>
          <div className='flex items-center'>
            <h3 className='font-medium text-muted-foreground'>Task Log</h3>
          </div>
          <div className='w-120'>
            <SearchBar />
          </div>
        </div>
        <div className='flex justify-center gap-2'>
          <NewTaskButton />
          <FilterButton />
          <SortButton />
          <LayoutViewButton />
        </div>
      </div>
      <hr />
      <div className='flex justify-center'>
        <Task />
        <Task />
        <Task />
      </div>
    </div>
  )
}

export default TaskContainer