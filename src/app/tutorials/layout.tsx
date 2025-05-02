import { Navbar } from '@/components/Navbar'
import React from 'react'

const TutorialLayout = ({children}: {children: React.ReactNode}) => {
  return (
    <>
        <Navbar />
        {children}
    </>
  )
}

export default TutorialLayout;