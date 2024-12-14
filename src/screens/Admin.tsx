import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MenuTab } from "@/components/admin/MenuTab";
import { OffersTab } from "@/components/admin/OffersTab";
import { useMenuStore } from '@/store/menuStore';
import { useOfferStore } from '@/store/offerStore';

export default function Admin() {
  const { fetchMenu } = useMenuStore();
  const { subscribeToOffers, unsubscribeFromOffers } = useOfferStore();

  useEffect(() => {
    fetchMenu();
    subscribeToOffers();

    return () => {
      unsubscribeFromOffers();
    };
  }, [fetchMenu, subscribeToOffers, unsubscribeFromOffers]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        
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