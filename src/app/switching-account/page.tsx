"use client";
import OfferLoadinPage from "@/components/OfferLoadinPage";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const Page = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/"); // Redirect to home page after switching accounts
    }, 2000); // Simulate a delay for switching accounts

    return () => clearTimeout(timer);
  }, [router]);

  return <OfferLoadinPage message="Switching account..." />
};

export default Page;
