import { Navbar } from '@/components/Navbar';
import React from 'react'

const HotelsLayout = ({children}: {children: React.ReactNode}) => {
  return (
    <>
        <Navbar />
        {children}
    </>
  )
}

export default HotelsLayout;