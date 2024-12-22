"use client";

import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuTab } from "@/components/admin/MenuTab";
import { OffersTab } from "@/components/admin/OffersTab";
import { useMenuStore } from "@/store/menuStore";
import { useOfferStore } from "@/store/offerStore";
import { useAuthStore } from "@/store/authStore";

export default function Admin() {
  const { fetchMenu, loading: menuLoading } = useMenuStore();
  const { subscribeToOffers, unsubscribeFromOffers } = useOfferStore();
  const { user, userData, loading: authLoading, fetchUserData } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchUserData(user.uid); // Fetch user data when user is logged in
    }

    fetchMenu(); // Fetch menu data
    subscribeToOffers();

    return () => {
      unsubscribeFromOffers();
    };
  }, [user, fetchMenu, fetchUserData, subscribeToOffers, unsubscribeFromOffers]);

  // Show loading spinner if auth or menu data is loading
  if (authLoading || menuLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 flex justify-center items-center">
        <div className="max-w-2xl w-full p-6 bg-white border-4 border-orange-500 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-orange-600 mb-4">Loading...</h2>
          <p className="text-gray-900 mb-4">
            Please wait while we load your information.
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if user is not logged in
  if (!user || !userData) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 flex justify-center items-center">
        <div className="max-w-2xl w-full p-6 bg-white border-4 border-orange-500 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-orange-600 mb-4">
            User Not Logged In
          </h2>
          <p className="text-gray-900 mb-4">
            Please log in to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Show verification message if the hotel is not verified
  if (!userData.verified) {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          {userData.hotelName} Admin Dashboard
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
