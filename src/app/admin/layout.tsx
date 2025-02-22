import { Navbar } from "@/components/Navbar";
import React from "react";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

export default AdminLayout;
