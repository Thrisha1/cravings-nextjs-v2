"use client";

import React, { useEffect, useState } from "react";
import { useDemoPartnerStore, DemoPartner } from "@/store/demoPartnerStore_hasura";
import { useMenuStore, MenuItem } from "@/store/menuStore_hasura";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

// --- Hardcoded mapping: type/food_type -> real partner_id for menu fetching ---
const typeToPartnerId: Record<string, string | Record<string, string>> = {
  restaurant: {
    veg: "272d9a75-b2f3-46b6-9530-773d3521db6d",         // <-- EDIT THIS: set real partner_id for veg restaurant
    "non-veg": "373a15f9-9c58-4e34-ae07-b272e578928f" // <-- EDIT THIS: set real partner_id for non-veg restaurant
  },
  cafe: "c62da624-f2b6-4ebc-8b8a-504c1e7d936e",
  bakery: "real-partner-id-3",
  hotel: "f69c10f9-3d5c-4078-b327-c76be78e8144",
};

export default function DemoPartnerDetailPage() {
  const { id } = useParams();
  const { demoPartners, fetchDemoPartners } = useDemoPartnerStore();
  const { items: menu, fetchMenu } = useMenuStore();
  const [partner, setPartner] = useState<DemoPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchDemoPartners().then((partners) => {
      const found = partners.find((p) => p.id === id);
      setPartner(found || null);
      setLoading(false);
    });
  }, [id, fetchDemoPartners]);

  // Fetch menu if mapping exists
  useEffect(() => {
    if (!partner) return;
    let partnerId: string | undefined;
    if (partner.type === "restaurant" && partner.food_type) {
      const mapping = typeToPartnerId.restaurant as Record<string, string>;
      partnerId = mapping[partner.food_type];
    } else {
      const mapping = typeToPartnerId[partner.type];
      partnerId = typeof mapping === "string" ? mapping : undefined;
    }
    if (partnerId) {
      setMenuLoading(true);
      fetchMenu(partnerId).finally(() => setMenuLoading(false));
    }
  }, [partner, fetchMenu]);

  if (loading) {
    return <div className="max-w-3xl mx-auto py-12 px-4"><div className="h-40 bg-gray-100 animate-pulse rounded-lg mb-6" /><div className="h-8 bg-gray-100 animate-pulse rounded w-1/2 mb-2" /><div className="h-6 bg-gray-100 animate-pulse rounded w-1/3 mb-4" /><div className="h-32 bg-gray-100 animate-pulse rounded" /></div>;
  }
  if (!partner) {
    return <div className="max-w-3xl mx-auto py-12 px-4 text-center text-gray-500">Demo partner not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <img
          src={partner.banner}
          alt={partner.name}
          className="w-full md:w-64 h-48 object-cover rounded-lg border"
        />
        <div>
          <h1 className="text-3xl font-bold mb-2">{partner.name}</h1>
          <div className="text-gray-600 mb-1 capitalize">Type: {partner.type}</div>
          {partner.type === "restaurant" && partner.food_type && (
            <div className="text-gray-600 mb-1 capitalize">Food Type: {partner.food_type}</div>
          )}
          <div className="text-gray-700 mt-4">{partner.description}</div>
        </div>
      </div>
      {/* --- Menu Section --- */}
      {(partner.type === "restaurant" && partner.food_type && (typeToPartnerId.restaurant as Record<string, string>)[partner.food_type]) ||
       (typeToPartnerId[partner.type] && typeof typeToPartnerId[partner.type] === "string") ? (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Menu</h2>
          {menuLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : menu.length === 0 ? (
            <div className="text-gray-500">No menu items found for this demo partner.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {menu.map((item: MenuItem) => (
                <div key={item.id} className="bg-white rounded shadow p-4 flex items-center gap-4">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded border"
                  />
                  <div>
                    <div className="font-semibold text-lg">{item.name}</div>
                    <div className="text-gray-600 text-sm">{item.description}</div>
                    <div className="text-gray-800 font-bold mt-1">₹{item.price}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-500 mt-8">No menu mapping for this type. (Edit <code>typeToPartnerId</code> in the code to add one.)</div>
      )}
    </div>
  );
} 