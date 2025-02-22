import { Navbar } from '@/components/Navbar'
import React from 'react'

const PartnerLayout = ({children}: {children: React.ReactNode}) => {
  return (
    <>
        <Navbar />
        {children}
    </>
  )
}

export default PartnerLayout;