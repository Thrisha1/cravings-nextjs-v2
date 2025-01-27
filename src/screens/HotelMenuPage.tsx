"use client";
import React, { useEffect, useState } from "react";
import NoOffersFound from "@/components/NoOffersFound";
import SearchBox from "@/components/SearchBox";
// import {
//   Drawer,
//   DrawerClose,
//   DrawerContent,
//   DrawerDescription,
//   DrawerFooter,
//   DrawerHeader,
//   DrawerTitle,
//   DrawerTrigger,
// } from "@/components/ui/drawer";
// import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Offer } from "@/store/offerStore";
import { useAuthStore, UserData } from "@/store/authStore";
import OfferCardMin from "@/components/OfferCardMin";
import { MapPin, Users, VerifiedIcon } from "lucide-react";
import MenuItemCard from "@/components/MenuItemCard";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { revalidate } from "@/app/actions/revalidate";
import { toast } from "sonner";
import Link from "next/link";

export type MenuItem = {
  description: string;
  id: string;
  image: string;
  name: string;
  price: number;
};

const HotelMenuPage = ({
  offers,
  hoteldata,
  menu,
}: {
  offers: Offer[];
  hoteldata: UserData;
  menu: MenuItem[];
}) => {
  const { user, userData, updateUserData } = useAuthStore();
  const router = useRouter();
  const [isFollowed, setIsFollowed] = useState<boolean>(false);
  // const [items, setItems] = useState<Offer[]>([]);
  // const [totalPrice, setTotalPrice] = useState<number>(0);

  // const addItems = (item: Offer) => {
  //   setItems((prev) => {
  //     const existingItemIndex = prev.findIndex((i) => i.id === item.id); // Assuming each item has a unique `id`.

  //     if (existingItemIndex !== -1) {
  //       // If the item already exists, update its qty
  //       const updatedItems = [...prev];
  //       const existingItem = updatedItems[existingItemIndex];
  //       updatedItems[existingItemIndex] = {
  //         ...existingItem,
  //         qty: (existingItem.qty || 0) + 1, // Increment qty, default to 0 if undefined
  //       };
  //       return updatedItems;
  //     }

  //     // If the item does not exist, add it with qty = 1
  //     return [...prev, { ...item, qty: 1 }];
  //   });

  //   setTotalPrice((prev) => prev + item.newPrice); // Update total price as normal

  //   // Use updated state in localStorage
  //   setItems((prevItems) => {
  //     return prevItems;
  //   });
  // };

  const handleFollow = async () => {
    if (user) {
      const hotelDocRef = doc(db, "users", hoteldata?.id ?? "");
      await updateDoc(hotelDocRef, {
        followers: [
          ...(hoteldata?.followers ?? []),
          {
            user: user?.uid ?? "",
            phone: userData?.phone ?? "",
          },
        ],
      });

      await updateUserData(user.uid, {
        following: [
          ...(userData?.following ?? []),
          {
            user: hoteldata?.id ?? "",
            phone: hoteldata?.phone ?? "",
          },
        ],
      });

      toast.success("Following " + hoteldata.hotelName);
    }
    revalidate(hoteldata?.id ?? "");
  };

  const handleUnFollow = async () => {
    if (user) {
      const hotelDocRef = doc(db, "users", hoteldata?.id ?? "");
      await updateDoc(hotelDocRef, {
        followers: hoteldata?.followers?.filter(
          (follower) => follower.user !== user?.uid
        ),
      });

      await updateUserData(user.uid, {
        following: userData?.following?.filter(
          (following) => following.user !== hoteldata?.id
        ),
      });

      toast.error("Unfollowed " + hoteldata.hotelName);
    }
    revalidate(hoteldata?.id ?? "");
  };

  useEffect(() => {
    const isFollowed =
      hoteldata?.followers?.some(
        (follower) => follower.user === (user?.uid ?? "?")
      ) ?? false;
    console.log(isFollowed, hoteldata.followers);

    setIsFollowed(isFollowed);
  }, [hoteldata]);

  return (
    <main className="bg-gradient-to-b overflow-x-hidden from-orange-50 to-orange-100 relative">
      {/* banner Image  */}
      <div className="w-screen h-[200px] absolute top-0 z-0">
        <Image
          src={offers[0]?.dishImage ?? menu[0].image}
          alt={offers[0]?.dishName ?? menu[0].name}
          fill
          className="w-auto h-auto object-cover"
        />
      </div>

      {/* offers listing  */}
      <div className="relative max-w-7xl mx-auto px-3 pb-[80px] bg-gradient-to-b from-orange-50 to-orange-100 pt-[20px] mt-[160px] lg:mt-[200px] rounded-t-3xl">
        <div className="lg:hidden bg-orange-200 h-2 w-[20%] rounded-full absolute top-4 left-1/2 -translate-x-1/2" />

        {/* hotel name  */}
        <div className="flex justify-between pt-5 md:pt-10">
          <h1 className="text-lg relative flex lg:items-center max-w-[50%] md:text-3xl font-semibold  capitalize">
            <span>{hoteldata.hotelName}</span>
            <VerifiedIcon className="ml-2 text-green-600" />
          </h1>

          <Button
            onClick={isFollowed ? handleUnFollow : handleFollow}
            className="bg-orange-600 hover:bg-orange-500"
          >
            {isFollowed ? "Unfollow" : "Follow"}
          </Button>
        </div>

        {/* hotel details  */}
        <div className="pb-5 md:pb-10 pt-2 grid gap-2">
          <div className="flex items-center gap-2 text-black/60 text-sm w-fit">
            <span className="flex items-center gap-1"> <Users size={20} />  Followers : </span> <span>{hoteldata.followers?.length ?? 0}</span>
          </div>

          <div
            onClick={() => router.push(hoteldata?.location ?? "")}
            className="flex items-center gap-2 text-black/60 text-sm w-fit"
          >
            <span className="flex items-center gap-1" > <MapPin size={20} /> Area : </span> <span>{hoteldata.area}</span>{" "}
          </div>
        </div>

        <SearchBox />

        {/* available offer  */}
        {offers.length > 0 && (
          <section>
            <h1 className="text-lg relative flex max-w-[50%] md:text-3xl font-semibold pt-5 capitalize">
              Available Offers
            </h1>

            <section className="my-5 md:my-10">
              <>
                {/* offer list  */}
                <div className="grid gap-2 gap-y-5 grid-cols-2 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
                  {offers.map((offer: Offer) => {
                    const discount = Math.round(
                      ((offer.originalPrice - offer.newPrice) /
                        offer.originalPrice) *
                        100
                    );

                    return (
                      <Link href={'/offers/' + offer.id} key={offer.id} className="group">
                        <OfferCardMin
                          discount={discount}
                          offer={offer}
                          // onClick={() => addItems(offer)}
                        />
                      </Link>
                    );
                  })}
                </div>
              </>
            </section>
          </section>
        )}

        {/* Menu items  */}
        <section className="border-t-2 border-orange-600/10">
          <h1 className="text-lg relative flex max-w-[50%] md:text-3xl font-semibold pt-5 capitalize">
            All Menu Items
          </h1>

          <section className="mt-5 md:mt-10">
            {menu.length > 0 ? (
              <>
                {/* offer list  */}
                <div className="grid gap-2 gap-y-5 grid-cols-2 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
                  {menu.map((menuItem: MenuItem) => {
                    return (
                      <div key={menuItem.id} className="group">
                        <MenuItemCard menuItem={menuItem} />
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <NoOffersFound />
            )}
          </section>
        </section>
      </div>

      {/* bottom tab  */}
      {/* <div className="bg-white rounded-t-xl lg:max-w-[70vw] left-1/2 -translate-x-1/2 w-full min-h-[70px] fixed bottom-0 shadow-md shadow-black flex items-center justify-between gap-2 px-5 py-4 z-[50]">
        {items.length > 0 ? (
          <>

            <div className="grid">
              <p className="font-medium text-sm text-black/70">
                Items selected : {items.length}
              </p>
              <p className="font-semibold">Total Price : ₹{totalPrice}</p>
            </div>


            <Drawer>
              <DrawerTrigger className="bg-orange-600 text-white font-medium px-3 py-2 rounded">
                View
              </DrawerTrigger>
              <DrawerContent className="lg:w-[60vw] lg:mx-auto">
                <DrawerHeader>
                  <DrawerTitle>Selected Items</DrawerTitle>
                  <DrawerDescription className="grid">
                    View all the items you have selected
                  </DrawerDescription>
                </DrawerHeader>
                <main className="px-5 py-10 grid gap-3 max-h-[60vh] overflow-scroll overflow-x-hidden scrollbar-hidden">
                  {items.map((item: Offer) => (
                    <div
                      key={`${item.id}_checkout_item`}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="w-[80px] h-[80px] rounded-xl overflow-hidden relative bg-gray-200 ">
                        <Image
                          src={item.dishImage}
                          alt={item.dishName}
                          fill
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="font-medium text-sm flex-1 text-pretty">
                        {item.dishName}
                      </p>
                      <div className="text-center">
                        <p className="font-semibold">
                          ₹{item.newPrice * (item.qty ?? 1)}
                        </p>
                        <p className="text-[12px] text-gray-400">
                          QTY : {item.qty}
                        </p>
                      </div>
                    </div>
                  ))}
                </main>
                <DrawerFooter>
                  <DrawerClose>
                    <Button
                      onClick={() => {
                        setItems([]);
                        setTotalPrice(0);
                      }}
                      className="w-full font-medium"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </DrawerClose>
                  <Button className="font-semibold bg-orange-600 hover:bg-orange-500">
                    Checkout
                  </Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </>
        ) : (
          <p className="font-medium text-black/70 text-center w-full">
            Please select the items
          </p>
        )}
      </div> */}
    </main>
  );
};

export default HotelMenuPage;
