"use client";

import { useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuTab } from "@/components/admin/MenuTab";
import { OffersTab } from "@/components/admin/OffersTab";
import { useMenuStore } from "@/store/menuStore";
import { useAuthStore } from "@/store/authStore";
import { redirect } from "next/navigation";
import { Partner } from "@/api/partners";

export default function Admin() {
  const { fetchMenu } = useMenuStore();
  const { userData } = useAuthStore();

  // Strict partner role check and redirect
  useEffect(() => {
    const sysbio = localStorage.getItem("sysbio");
    if (!sysbio) {
      redirect("/login");
    } else if (userData?.role !== "partner") {
      redirect("/offers"); 
    } else {
      fetchMenu();
    }
  }, [userData, fetchMenu]);


if ((userData as Partner)?.status === "inactive") {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 flex justify-center items-center">
      <div className="max-w-2xl w-full p-6 bg-white border-4 border-orange-500 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-orange-600 mb-4">
          Hotel Verification In Progress
        </h2>
        <p className="text-gray-900 mb-4">
          You are currently in the verification process. We will verify your
          hotel within 24 hours. For immediate verification, please call{" "}
          <span className="font-bold text-orange-600">+91 6238969297</span>.
        </p>
      </div>
    </div>
  );
}

  // Main dashboard for active partners
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-gray-900 capitalize mb-8">
          {(userData as Partner)?.store_name} Admin Dashboard
        </h1>

        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="offers">Offers</TabsTrigger>
          </TabsList>
          <TabsContent value="menu">
            <MenuTab />
          </TabsContent>
          <TabsContent value="offers">
            <OffersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}