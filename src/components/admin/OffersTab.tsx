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
import { useMenuStore } from "@/store/menuStore";
import { Offer, useOfferStore } from "@/store/offerStore";
import { useAuthStore } from "@/store/authStore";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function OffersTab() {
  const { items } = useMenuStore();
  const { addOffer, deleteOffer } = useOfferStore();
  const { user, userData } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [newOffer, setNewOffer] = useState({
    menuItemId: "",
    newPrice: "",
    itemsAvailable: "",
    fromTime: "",
    toTime: "",
  });
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isAdding, setAdding] = useState(false);
  const [isDeleting, setDeleting] = useState(false);

  const getUserOffers = async () => {
    const now = new Date().toString();
    const offersCollection = collection(db, "offers");
    const offersQuery = query(
      offersCollection,
      where("hotelId", "==", user?.uid),
      where("toTime", "<", now)
    );
    const querySnapshot = await getDocs(offersQuery);
    const offers: Offer[] = [];
    querySnapshot.forEach((doc) => {
      offers.push({ id: doc.id, ...doc.data() } as Offer);
    });
    setOffers(offers);
  };

  const handleOfferDelete = (id: string) => async () => {
    setDeleting(true);
    await deleteOffer(id);
    await getUserOffers();
    setDeleting(false);
  };

  useEffect(() => {
    (async () => {
      await getUserOffers();
    })();
  }, [user]);

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
      return;
    }

    if(new Date(newOffer.fromTime) > new Date(newOffer.toTime)) {
      alert("From time cannot be greater than to time");
      return;
    }

    if(new Date(newOffer.fromTime) < new Date()) {
      alert("From time cannot be in the past");
      return;
    }

    if(new Date(newOffer.toTime) < new Date()) {
      alert("To time cannot be in the past");
      return;
    }

    if(new Date(newOffer.toTime) < new Date(newOffer.fromTime)) {
      alert("To time cannot be less than from time");
      return;
    }

    if(new Date(newOffer.toTime).getTime() - new Date(newOffer.fromTime).getTime() < 1000 * 60 * 15) {
      alert("Offer duration should be atleast 15 minutes");
      return;
    }

    await addOffer({
      menuItemId: newOffer.menuItemId,
      newPrice: parseFloat(newOffer.newPrice),
      itemsAvailable: parseInt(newOffer.itemsAvailable),
      fromTime: new Date(newOffer.fromTime),
      toTime: new Date(newOffer.toTime),
      category: userData?.category || "hotel",
    });

    setNewOffer({
      menuItemId: "",
      newPrice: "",
      itemsAvailable: "",
      fromTime: "",
      toTime: "",
    });
    setIsOpen(false);
    setAdding(false);
    await getUserOffers();
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
                      <SelectItem key={item.id} value={item.id}>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map((offer) => {
          const menuItem = items.find((item) => item.id === offer.menuItemId);
          if (!menuItem) return null;

          return (
            <Card key={offer.id}>
              <CardHeader>
                <CardTitle>{menuItem.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg">
                    Original Price: ₹{offer.originalPrice.toFixed(2)}
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    Offer Price: ₹{offer.newPrice.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    From: {new Date(offer.fromTime).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    To: {new Date(offer.toTime).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Created At: {new Date(offer.createdAt).toLocaleString()}
                  </p>
                  <Button
                    disabled={isDeleting}
                    variant="destructive"
                    className="w-full mt-2"
                    onClick={
                      isDeleting ? undefined : handleOfferDelete(offer.id)
                    }
                  >
                    {isDeleting ? "Deleting..." : "Delete Offer"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
