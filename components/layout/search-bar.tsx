import React from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { FaMagnifyingGlass } from "react-icons/fa6";

const SearchBar = () => {
  return (
    <div className='flex'>
      <Input 
        type='search' 
        placeholder='Search...' 
        className='rounded-tl-2xl rounded-bl-2xl rounded-tr-none rounded-br-none'/>
      <Button
        className='rounded-tr-2xl rounded-br-2xl rounded-tl-none rounded-bl-none'
      >
        <FaMagnifyingGlass />
      </Button>
    </div>
  )
}

export default SearchBar