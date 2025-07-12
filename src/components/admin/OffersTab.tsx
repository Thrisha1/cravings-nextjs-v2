import { useEffect, useState, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { useMenuStore } from "@/store/menuStore_hasura";
import { OfferGroup, useOfferStore } from "@/store/offerStore_hasura";
import { formatDate } from "@/lib/formatDate";
import Img from "../Img";
import { CreateOfferForm } from "./CreateOfferForrm";



export function OffersTab() {
  const { items } = useMenuStore();
  const { addOffer, fetchPartnerOffers, offers, deleteOffer } = useOfferStore();
  const { userData } = useAuthStore();
  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false);
  const [isOfferFetched, setIsOfferFetched] = useState(false);
  const [isDeleting, setDeleting] = useState<Record<string, boolean>>({});

  const handleOfferDelete = (id: string) => async () => {
    setDeleting({
      ...isDeleting,
      [id]: true,
    });
    await deleteOffer(id);
    setDeleting({
      ...isDeleting,
      [id]: false,
    });
  };

  useEffect(() => {
    (async () => {
      if (userData) {
        await fetchPartnerOffers();
        setTimeout(() => {
          setIsOfferFetched(true);
        }, 2000);
      }
    })();
  }, [userData]);

  const handleCreateOffer = async (
    offer: {
      menu_id?: string;
      offer_price?: number;
      items_available?: number;
      start_time: string;
      end_time: string;
      offer_group?: OfferGroup;
    },
    notificationMessage: {
      title: string;
      body: string;
    }
  ) => {
    await addOffer(offer , notificationMessage);
    setIsCreateOfferOpen(false);
  };

  return (
    <div >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Active Offers</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsCreateOfferOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Tab switch: show create offer form or offer list */}
      {isCreateOfferOpen ? (
        <CreateOfferForm
          onSubmit={handleCreateOffer}
          onCancel={() => setIsCreateOfferOpen(false)}
        />
      ) : (
        <>
          {offers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offers.map((offer) => {
                return (
                  <Card key={offer.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {offer.menu.name}
                      </CardTitle>
                      <div className="relative w-32 h-32 rounded-md overflow-hidden">
                        <Img
                          src={offer.menu.image_url}
                          alt={offer.menu.name}
                          className="object-cover w-full h-full "
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-lg">
                          Original Price: ₹{offer.menu.price.toFixed(2)}
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          Offer Price: ₹{offer?.offer_price?.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          From: {formatDate(offer.start_time)}
                        </p>
                        <p className="text-sm text-gray-500">
                          To: {formatDate(offer.end_time)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Created At: {formatDate(offer.created_at)}
                        </p>
                        <Button
                          disabled={isDeleting[offer.id]}
                          variant="destructive"
                          className="w-full mt-2"
                          onClick={
                            isDeleting[offer.id]
                              ? undefined
                              : handleOfferDelete(offer.id)
                          }
                        >
                          {isDeleting[offer.id]
                            ? "Deleting..."
                            : "Delete Offer"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center mt-4">
              {isOfferFetched ? "No Offers Found!" : "Loading Offers...."}
            </div>
          )}
        </>
      )}
    </div>
  );
}
