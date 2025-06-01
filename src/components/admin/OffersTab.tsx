import { useEffect, useState, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FullModal,
  FullModalContent,
  FullModalHeader,
  FullModalTitle,
  FullModalBody,
  FullModalFooter,
} from "@/components/ui/full_modal";
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
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const formContainerRef = useRef<HTMLDivElement>(null);

  // Create refs for the form fields
  const priceInputRef = useRef<HTMLInputElement>(null);
  const itemsInputRef = useRef<HTMLInputElement>(null);
  const fromTimeInputRef = useRef<HTMLInputElement>(null);
  const toTimeInputRef = useRef<HTMLInputElement>(null);

  const scrollToView = (el: HTMLElement) => {
    if (formContainerRef.current && el) {
      setTimeout(() => {
        // Scroll the element into view with some offset from the top
        const yOffset = -100;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
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
      window.visualViewport.addEventListener('resize', handleResize);
    }

    // Clean up
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

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

  const handleCancel = () => {
    // Blur any focused inputs to dismiss the keyboard
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    
    setNewOffer({
      menuItemId: "",
      newPrice: "",
      itemsAvailable: "",
      fromTime: "",
      toTime: "",
    });
    setIsOpen(false);
    setKeyboardOpen(false);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Active Offers</h2>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
        
        <FullModal open={isOpen} onOpenChange={setIsOpen}>
          <FullModalContent>
            <FullModalHeader>
              <FullModalTitle>Create New Offer</FullModalTitle>
            </FullModalHeader>
            <FullModalBody>
              <div ref={formContainerRef} className="pb-20">
                <form id="create-offer-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="menuItem">Select Menu Item</Label>
                    <Select
                      required
                      value={newOffer.menuItemId}
                      onValueChange={(value) => {
                        setNewOffer({ ...newOffer, menuItemId: value });
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
                    <Label htmlFor="itemsAvailable">
                      Number of Items Available
                    </Label>
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
                </form>
              </div>
            </FullModalBody>
            <FullModalFooter 
              className={`${keyboardOpen ? 'keyboard-visible' : ''} sticky-footer`}
              style={{
                // Use style to ensure the footer stays above the keyboard
                bottom: keyboardOpen ? `${window.visualViewport?.offsetTop || 0}px` : '0',
                position: 'fixed',
                width: '100%',
              }}
            >
              <Button
                variant="outline"
                onClick={handleCancel}
                type="button"
              >
                Cancel
              </Button>
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
                form="create-offer-form"
                className="bg-orange-600"
              >
                {isAdding ? "Creating..." : "Create Offer"}
              </Button>
            </FullModalFooter>
          </FullModalContent>
        </FullModal>
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
