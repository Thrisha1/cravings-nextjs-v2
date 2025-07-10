import { useEffect, useState, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { MenuItem, useMenuStore } from "@/store/menuStore_hasura";
import { useOfferStore } from "@/store/offerStore_hasura";
import { formatDate } from "@/lib/formatDate";
import Img from "../Img";
import { HotelData } from "@/app/hotels/[...id]/page";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

interface CreateOfferFormProps {
  onSubmit: (
    offer: {
      menu_id: string;
      offer_price: number;
      items_available: number;
      start_time: string;
      end_time: string;
    },
    notificationMessage?: {
      title?: string;
      body?: string;
    }
  ) => Promise<void>;
  onCancel: () => void;
}

export function CreateOfferForm({ onSubmit, onCancel }: CreateOfferFormProps) {
  const { items } = useMenuStore();
  const [newOffer, setNewOffer] = useState({
    menuItemId: "",
    newPrice: "",
    itemsAvailable: "",
    fromTime: "",
    toTime: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const [slectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const { userData } = useAuthStore();

  // Create refs for the form fields
  const priceInputRef = useRef<HTMLInputElement>(null);
  const itemsInputRef = useRef<HTMLInputElement>(null);
  const fromTimeInputRef = useRef<HTMLInputElement>(null);
  const toTimeInputRef = useRef<HTMLInputElement>(null);

  const notificationTitleRef = useRef<HTMLInputElement>(null);
  const notificationBodyRef = useRef<HTMLInputElement>(null);

  const [notificationMessage, setNotificationMessage] = useState<{
    title?: string;
    body?: string;
  } | null>(null);

  const scrollToView = (el: HTMLElement) => {
    if (formContainerRef.current && el) {
      setTimeout(() => {
        // Scroll the element into view with some offset from the top
        const yOffset = -100;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }, 300);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setKeyboardOpen(true);
    scrollToView(e.target);
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      // Only set keyboard as closed if no inputs are focused
      if (
        document.activeElement !== priceInputRef.current &&
        document.activeElement !== itemsInputRef.current &&
        document.activeElement !== fromTimeInputRef.current &&
        document.activeElement !== toTimeInputRef.current
      ) {
        setKeyboardOpen(false);
      }
    }, 100);
  };

  // Add listener for visual viewport resize (keyboard opening/closing)
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;

        // If visual viewport is significantly smaller than window height, keyboard is probably open
        if (windowHeight - currentHeight > 150) {
          setKeyboardOpen(true);
        } else {
          setKeyboardOpen(false);
        }
      }
    };

    // Add the event listener
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    }

    // Clean up
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (
      !newOffer.menuItemId ||
      !newOffer.newPrice ||
      !newOffer.itemsAvailable ||
      !newOffer.fromTime ||
      !newOffer.toTime
    ) {
      toast.error("Please fill all the fields");
      setIsSubmitting(false);
      return;
    }

    if (
      new Date(newOffer.fromTime) <
      new Date(new Date().getTime() - 1000 * 60 * 15)
    ) {
      toast.error("From time cannot be in the past");
      setIsSubmitting(false);
      return;
    }

    if (
      new Date(newOffer.toTime) <
      new Date(new Date().getTime() + 1000 * 60 * 15)
    ) {
      toast.error("To time cannot be in the past");
      setIsSubmitting(false);
      return;
    }

    if (new Date(newOffer.fromTime) > new Date(newOffer.toTime)) {
      toast.error("From time cannot be greater than to time");
      setIsSubmitting(false);
      return;
    }

    if (new Date(newOffer.toTime) < new Date(newOffer.fromTime)) {
      toast.error("To time cannot be less than from time");
      setIsSubmitting(false);
      return;
    }

    if (
      new Date(newOffer.toTime).getTime() -
        new Date(newOffer.fromTime).getTime() <
      1000 * 60 * 15
    ) {
      toast.error("Offer duration should be at least 15 minutes");
      setIsSubmitting(false);
      return;
    }

    const correspondingItem = items.find(
      (item) => item.id === newOffer.menuItemId
    );

    if (correspondingItem?.image_url === "") {
      toast.error("Please upload an image for the menu item");
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(
        {
          menu_id: newOffer.menuItemId,
          offer_price: parseFloat(newOffer.newPrice),
          items_available: parseInt(newOffer.itemsAvailable),
          start_time: newOffer.fromTime,
          end_time: newOffer.toTime,
        },
        {
          title: notificationMessage?.title || "",
          body: notificationMessage?.body || "",
        }
      );
    } catch (error) {
      toast.error("Failed to create offer");
      console.error(error);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4">Create New Offer</h2>
      <div ref={formContainerRef}>
        <form
          id="create-offer-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="menuItem">Select Menu Item</Label>
            <Select
              required
              value={newOffer.menuItemId}
              onValueChange={(value) => {
                setNewOffer({ ...newOffer, menuItemId: value });
                const selectedItem = items.find((item) => item.id === value);
                setSelectedItem(selectedItem || null);
                // Force close keyboard if open
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
              }}
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
              ref={priceInputRef}
              id="newPrice"
              type="number"
              placeholder="Enter new price"
              value={newOffer.newPrice}
              onChange={(e) =>
                setNewOffer({ ...newOffer, newPrice: e.target.value })
              }
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemsAvailable">Number of Items Available</Label>
            <Input
              required
              ref={itemsInputRef}
              id="itemsAvailable"
              type="number"
              placeholder="Enter quantity"
              value={newOffer.itemsAvailable}
              onChange={(e) =>
                setNewOffer({ ...newOffer, itemsAvailable: e.target.value })
              }
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fromTime">From Time</Label>
            <Input
              required
              ref={fromTimeInputRef}
              id="fromTime"
              type="datetime-local"
              value={newOffer.fromTime}
              onChange={(e) =>
                setNewOffer({ ...newOffer, fromTime: e.target.value })
              }
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="toTime">To Time</Label>
            <Input
              required
              ref={toTimeInputRef}
              id="toTime"
              type="datetime-local"
              value={newOffer.toTime}
              onChange={(e) =>
                setNewOffer({ ...newOffer, toTime: e.target.value })
              }
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>

          {(newOffer?.menuItemId && newOffer?.newPrice && newOffer?.toTime) && (
            <div className="border-t-2 border-black/10 pt-4">
              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    <h1 className="font-medium mb-4 text-base">
                      Notification Settings
                    </h1>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="notificationTitle">Title</Label>
                      <Input
                        ref={notificationTitleRef}
                        id="notificationTitle"
                        placeholder={`New Offer: ${slectedItem?.name} at ${
                          (userData as HotelData)?.store_name
                        }`}
                        value={notificationMessage?.title || ""}
                        onChange={(e) =>
                          setNotificationMessage({
                            ...notificationMessage,
                            title: e.target.value,
                          })
                        }
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notificationBody">Description</Label>
                      <Input
                        ref={notificationBodyRef}
                        id="notificationBody"
                        placeholder={`Check out the new offer: ${
                          slectedItem?.name
                        } for just ${(userData as HotelData)?.currency ?? "₹"}${
                          newOffer.newPrice
                        }. Valid until ${new Date(
                          newOffer?.toTime
                        ).toLocaleDateString()}`}
                        value={notificationMessage?.body || ""}
                        onChange={(e) =>
                          setNotificationMessage({
                            ...notificationMessage,
                            body: e.target.value,
                          })
                        }
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onCancel} type="button">
              Cancel
            </Button>
            <Button
              disabled={
                isSubmitting ||
                !newOffer.menuItemId ||
                !newOffer.newPrice ||
                !newOffer.itemsAvailable ||
                !newOffer.fromTime ||
                !newOffer.toTime
              }
              type="submit"
              form="create-offer-form"
              className="bg-orange-600"
            >
              {isSubmitting ? "Creating..." : "Create Offer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
      menu_id: string;
      offer_price: number;
      items_available: number;
      start_time: string;
      end_time: string;
    },
    notificationMessage?: {
      title?: string;
      body?: string;
    }
  ) => {
    await addOffer(offer , notificationMessage);
    setIsCreateOfferOpen(false);
  };

  return (
    <div className="p-4">
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
