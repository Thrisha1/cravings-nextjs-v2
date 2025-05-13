import { Navbar } from '@/components/Navbar';
import React from 'react'

const QrScanLayout = ({children}: {children: React.ReactNode}) => {
  return (
    <>
        <Navbar />
        {children}
    </>
  )
}

export default QrScanLayout;