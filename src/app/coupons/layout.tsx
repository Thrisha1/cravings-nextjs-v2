import { Navbar } from '@/components/Navbar'
import React from 'react'

const CouponsLayout = ({children}: {children: React.ReactNode}) => {
  return (
    <>
        <Navbar />
        {children}
    </>
  )
}

export default CouponsLayout;