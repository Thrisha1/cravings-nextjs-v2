import BottomNav from "@/components/BottomNav";
import { Navbar } from "@/components/Navbar";
import React from "react";

const OffersLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      {children}
      <BottomNav />
    </>
  );
};

export default OffersLayout;
