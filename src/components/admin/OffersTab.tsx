import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { useMenuStore } from "@/store/menuStore_hasura";
import { useOfferStore } from "@/store/offerStore_hasura";
import Image from "next/image";
import { formatDate } from "@/lib/formatDate";
import Img from "../Img";

export function OffersTab() {
  const { items } = useMenuStore();
  const { addOffer, fetchPartnerOffers, offers, deleteOffer } = useOfferStore();
  const { userData } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isOfferFetched, setIsOfferFetched] = useState(false);
  const [newOffer, setNewOffer] = useState({
    menuItemId: "",
    newPrice: "",
    itemsAvailable: "",
    fromTime: "",
    toTime: "",
  });
  const [isAdding, setAdding] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);

    if (
      !newOffer.menuItemId ||
      !newOffer.newPrice ||
      !newOffer.itemsAvailable ||
      !newOffer.fromTime ||
      !newOffer.toTime
    ) {
      alert("Please fill all the fields");
      setAdding(false);
      return;
    }

    if (
      new Date(newOffer.fromTime) <
      new Date(new Date().getTime() - 1000 * 60 * 15)
    ) {
      alert("From time cannot be in the past");
      setAdding(false);
      return;
    }

    if (
      new Date(newOffer.toTime) <
      new Date(new Date().getTime() + 1000 * 60 * 15)
    ) {
      alert("To time cannot be in the past");
      setAdding(false);
      return;
    }

    if (new Date(newOffer.fromTime) > new Date(newOffer.toTime)) {
      alert("From time cannot be greater than to time");
      setAdding(false);
      return;
    }

    if (new Date(newOffer.toTime) < new Date(newOffer.fromTime)) {
      alert("To time cannot be less than from time");
      setAdding(false);
      return;
    }

    if (
      new Date(newOffer.toTime).getTime() -
        new Date(newOffer.fromTime).getTime() <
      1000 * 60 * 15
    ) {
      alert("Offer duration should be atleast 15 minutes");
      setAdding(false);
      return;
    }

    const correspondingItem = items.find(
      (item) => item.id === newOffer.menuItemId
    );

    if (correspondingItem?.image_url === "") {
      toast.error("Please upload an image for the menu item");
      setAdding(false);
      return;
    }

    try {
      await addOffer({
        menu_id: newOffer.menuItemId,
        offer_price: parseFloat(newOffer.newPrice),
        items_available: parseInt(newOffer.itemsAvailable),
        start_time: newOffer.fromTime,
        end_time: newOffer.toTime,
      });
    } catch (error) {
      toast.error("Failed to create offer");
      console.error(error);
      setAdding(false);
      return;
    }

    setNewOffer({
      menuItemId: "",
      newPrice: "",
      itemsAvailable: "",
      fromTime: "",
      toTime: "",
    });
    setIsOpen(false);
    setAdding(false);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Active Offers</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Offer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="menuItem">Select Menu Item</Label>
                <Select
                  required
                  value={newOffer.menuItemId}
                  onValueChange={(value) =>
                    setNewOffer({ ...newOffer, menuItemId: value })
                  }
                >
                  <SelectTrigger id="menuItem">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.id} value={item.id as string}>
                        {item.name} - ₹{item.price.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPrice">New Price in ₹</Label>
                <Input
                  required
                  id="newPrice"
                  type="number"
                  placeholder="Enter new price"
                  value={newOffer.newPrice}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, newPrice: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="itemsAvailable">
                  Number of Items Available
                </Label>
                <Input
                  required
                  id="itemsAvailable"
                  type="number"
                  placeholder="Enter quantity"
                  value={newOffer.itemsAvailable}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, itemsAvailable: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fromTime">From Time</Label>
                <Input
                  required
                  id="fromTime"
                  type="datetime-local"
                  value={newOffer.fromTime}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, fromTime: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="toTime">To Time</Label>
                <Input
                  required
                  id="toTime"
                  type="datetime-local"
                  value={newOffer.toTime}
                  onChange={(e) =>
                    setNewOffer({ ...newOffer, toTime: e.target.value })
                  }
                />
              </div>

              <Button
                disabled={
                  isAdding ||
                  !newOffer.menuItemId ||
                  !newOffer.newPrice ||
                  !newOffer.itemsAvailable ||
                  !newOffer.fromTime ||
                  !newOffer.toTime
                }
                type="submit"
                className="w-full bg-orange-600"
              >
                {isAdding ? "Creating..." : "Create Offer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <>
        {offers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => {
              return (
                <Card key={offer.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{offer.menu.name}</CardTitle>
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
                        Offer Price: ₹{offer.offer_price.toFixed(2)}
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
                        {isDeleting[offer.id] ? "Deleting..." : "Delete Offer"}
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
    </div>
  );
}
