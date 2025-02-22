import { Navbar } from '@/components/Navbar'
import React from 'react'

const LoginLayout = ({children}: {children: React.ReactNode}) => {
  return (
    <>
        <Navbar />
        {children}
    </>
  )
}

export default LoginLayout;