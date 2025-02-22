import { Navbar } from '@/components/Navbar'
import React from 'react'

const ProfileLayout = ({children}: {children: React.ReactNode}) => {
  return (
    <>
        <Navbar />
        {children}
    </>
  )
}

export default ProfileLayout;