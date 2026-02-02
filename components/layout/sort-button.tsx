import React from 'react'
import { Button } from '../ui/button'
import { TbArrowsSort } from "react-icons/tb";

const SortButton = () => {
  return (
    <Button>
      Sort
      <TbArrowsSort />
    </Button>
  )
}

export default SortButton