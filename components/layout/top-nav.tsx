import React from 'react'
import SearchBar from './search-bar'
import { IoMdNotifications, IoMdSunny } from "react-icons/io";
import { FaGear } from "react-icons/fa6";

const TopNav = () => {
  return (
    <div className='py-4 border-b'>
        <div className='flex justify-start'>
          <div className="w-150">
            <SearchBar />
          </div>
          <div className='flex'>
            <IoMdNotifications className='w-6 h-6'/>
            <FaGear className='w-5 h-5'/>
            <IoMdSunny className='w-6 h-6' />
          </div>
        </div>
    </div>
  )
}

export default TopNav