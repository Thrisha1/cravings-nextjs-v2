import { Navbar } from "@/components/Navbar";
import React from "react";

const SuperAdminLayout = ({children}: {children: React.ReactNode}) => {
  return (
    <>
        <Navbar />  
        {children}
    </>
  )
}

export default SuperAdminLayout;