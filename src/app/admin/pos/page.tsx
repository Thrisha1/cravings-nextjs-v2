"use client";
import React, { useEffect } from "react";
import { POSMenuItems } from "@/components/pos/POSMenuItems";
import { POSCart } from "@/components/pos/POSCart";
import { useMenuStore } from "@/store/menuStore_hasura";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

const Page = () => {
  const { fetchMenu } = useMenuStore();
  const { userData } = useAuthStore();

  useEffect(() => {
    if (userData?.id) {
      fetchMenu();
    }
  }, [fetchMenu, userData]);

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Create a new bill</h1>
        <Link
          href="/admin/past_bills"
          className="bg-black text-white hover:text-black border-2 hover:border-black hover:bg-white font-semibold py-2 px-4 rounded"
        >
          See Past Bills
        </Link>
      </div>
      <POSMenuItems />
      <POSCart />
    </div>
  );
};

export default Page;
