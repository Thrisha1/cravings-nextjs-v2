import React from "react";
import { POSMenuItems } from "@/components/pos/POSMenuItems";
import { POSCart } from "@/components/pos/POSCart";
import Link from "next/link";
import { RiBillLine } from "react-icons/ri";
import { PostCheckoutModal } from "@/components/admin/pos/PostCheckoutModal";
import { EditOrderModal } from "@/components/admin/pos/EditOrderModal";
import OfferLoadinPage from "@/components/OfferLoadinPage";
import { getAuthCookie } from "@/app/auth/actions";
import { redirect } from "next/navigation";
import { getFeatures } from "@/lib/getFeatures";

const Page = async () => {
  const cookies = await getAuthCookie();

  console.log(cookies);
  

  if (!getFeatures(cookies?.feature_flags || "")?.pos?.enabled) {
    redirect("/admin");
  }

  if (!cookies?.id) {
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
      <EditOrderModal />
    </div>
  );
};

export default Page;
