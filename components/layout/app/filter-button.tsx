import React from 'react'
import { Button } from '@/components/ui/button';
import { IoFilterOutline } from "react-icons/io5";

const FilterButton = () => {
  return (
    <Button>
        Filter
        <IoFilterOutline />
    </Button>
  )
}

export default FilterButton