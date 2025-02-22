"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuTab } from "@/components/admin/MenuTab";
import { OffersTab } from "@/components/admin/OffersTab";
import { useMenuStore } from "@/store/menuStore";
import { useAuthStore } from "@/store/authStore";
import { redirect } from "next/navigation";
import Loading from "@/app/loading";

export default function Admin() {
  const { fetchMenu } = useMenuStore();
  const { user, userData, fetchUserData } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  const getUserData = async (uid: string) => {
    await fetchUserData(uid);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      getUserData(user.uid);
    }
    fetchMenu();
  }, [user, fetchMenu]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        redirect("/login");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading) {
    return <Loading />;
  }

  if (userData && !userData?.verified) {
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

  // Render the admin dashboard
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-gray-900 capitalize mb-8">
          {userData?.hotelName} Admin Dashboard
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
