"use client";
import React, { useEffect } from "react";
import { POSMenuItems } from "@/components/pos/POSMenuItems";
import { POSCart } from "@/components/pos/POSCart";
import { useMenuStore } from "@/store/menuStore_hasura";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { RiBillLine } from "react-icons/ri";
import { usePOSStore } from "@/store/posStore";
import { PostCheckoutModal } from "@/components/admin/pos/PostCheckoutModal";
import { EditOrderModal } from "@/components/admin/pos/EditOrderModal";
import OfferLoadinPage from "@/components/OfferLoadinPage";

const Page = () => {
  const { fetchMenu } = useMenuStore();
  const { userData } = useAuthStore();
  const { getPartnerTables } = usePOSStore();

  useEffect(() => {
    if (userData?.id) {
      getPartnerTables();
    }
  }, [userData]);

  useEffect(() => {
    if (userData?.id) {
      fetchMenu();
    }
  }, [fetchMenu, userData]);

  if (!userData) {
    return <OfferLoadinPage message="Loading Pos..." />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Create New Bill</h1>
        <Link
          href="/admin/orders"
          className="bg-black text-white hover:text-black border-2 hover:border-black hover:bg-white font-semibold py-2 px-4 rounded-lg"
        >
          <RiBillLine className="w-4 h-4 inline mr-2" />
          View Bills
        </Link>
      </div>
      <POSMenuItems />
      <POSCart />
      <PostCheckoutModal />
      <EditOrderModal  />
    </div>
  );
};

export default Page;
