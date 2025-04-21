"use client";
import { CommonOffer } from "@/components/superAdmin/OfferUploadSuperAdmin";
import { fetchFromHasura } from "@/lib/hasuraClient";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const Page = () => {
  const [offers, setOffers] = useState<CommonOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = async () => {
    try {
      const response = await fetchFromHasura(`query GetAllCommonOffers {
        common_offers(order_by: {created_at: desc} , where : {coordinates: {_is_null: true}}) {
          id
          partner_name
          item_name
          price
          image_url
          district
          location
          coordinates
          created_at
        }
      }`);

      if (response.common_offers) {
        setOffers(response.common_offers);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const convertUrl = async (url: string, id: string) => {
    toast.loading("Converting URL...", {
      id: id,
    });
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_SERVER_URL + "/api/convert-coordinate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url, id }),
        }
      );

      const data = await response.json();

      if (!data.updateResponse) {
        throw new Error("No coordinates found in response");
      }

      toast.dismiss(id);
      toast.success("Coordinates updated successfully");
      console.log("Updated Coordinates:", data.updateResponse);
      // Optionally: Refresh the data
      fetchOffers();
    } catch (error) {
      toast.dismiss(id);
      console.error("Error converting/updating coordinates:", error);
      toast.error("Error converting or updating coordinates");
    }
  };

  if (loading) {
    return <div>Loading offers...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Common Offers</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b">Id</th>
              <th className="py-2 px-4 border-b">Partner</th>
              <th className="py-2 px-4 border-b">Item</th>
              <th className="py-2 px-4 border-b">Price</th>
              <th className="py-2 px-4 border-b">Image</th>
              <th className="py-2 px-4 border-b">District</th>
              <th className="py-2 px-4 border-b">Location</th>
              <th className="py-2 px-4 border-b">Coordinates</th>
              <th className="py-2 px-4 border-b">Created At</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr
                onClick={async () => {
                  // await convertUrl(offer.location as string, offer.id);
                }}
                key={offer.id}
                className="hover:bg-gray-50"
              >
                <td className="py-2 px-4 border-b">{offer.id}</td>

                <td className="py-2 px-4 border-b">{offer.partner_name}</td>
                <td className="py-2 px-4 border-b">{offer.item_name}</td>
                <td className="py-2 px-4 border-b">{offer.price}</td>
                <td className="py-2 px-4 border-b">
                  {offer.image_url && (
                    <img
                      src={offer.image_url}
                      alt={offer.item_name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  )}
                </td>
                <td className="py-2 px-4 border-b">{offer.district}</td>
                <td className="py-2 px-4 border-b text-xs">{offer.location}</td>
                <td className="py-2 px-4 border-b text-xs">
                  {offer?.coordinates?.type}
                </td>
                <td className="py-2 px-4 border-b">
                  {new Date(offer?.created_at as string).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Page;
