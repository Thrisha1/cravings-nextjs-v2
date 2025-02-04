"use client";
import React, { useEffect, useState } from "react";
import NoOffersFound from "@/components/NoOffersFound";
import SearchBox from "@/components/SearchBox";
import Image from "next/image";
import { Offer } from "@/store/offerStore";
import { useAuthStore, UserData } from "@/store/authStore";
import OfferCardMin from "@/components/OfferCardMin";
import { ArrowLeft, MapPin, Users, VerifiedIcon } from "lucide-react";
import MenuItemCard from "@/components/MenuItemCard";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { revalidate } from "@/app/actions/revalidate";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QrHotelAssignmentModal from "@/components/QrHotelAssignmentModal";
import Error from "@/app/hotels/error";

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
  qrScan,
}: {
  offers: Offer[];
  hoteldata: UserData;
  menu: MenuItem[];
  qrScan: string | null;
}) => {
  const { user, userData, updateUserVisits, handleFollow, handleUnfollow } =
    useAuthStore();
  const router = useRouter();
  const [isFollowed, setIsFollowed] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pathname = usePathname();
  const [showQrAssignModal, setShowQrAssignModal] = useState(false);
  const searchParams = useSearchParams();
  const qrId = searchParams.get("qid");
  const error = searchParams.get("error");

  const isLoggedIn = () => {
    console.log("isLoggedIn", userData);

    if (userData) {
      return;
    }

    const request = indexedDB.open("firebaseLocalStorageDb");

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction("firebaseLocalStorage", "readonly");
      const store = transaction.objectStore("firebaseLocalStorage");
      const getAllKeysRequest = store.getAllKeys();

      getAllKeysRequest.onsuccess = async () => {
        if (getAllKeysRequest.result.length == 0) {
          setShowAuthModal(true);
          return;
        }
      };

      getAllKeysRequest.onerror = () => {
        setShowAuthModal(true);
        return;
      };
    };

    request.onerror = () => {
      setShowAuthModal(true);
      return;
    };
  };

  const handleQrScan = async () => {
    const handleFollowAndUpdateUserVisits = async () => {
      try {
        await handleFollow(hoteldata?.id as string);
        await updateUserVisits(user?.uid as string, hoteldata?.id as string);
        toast.success("Following");
        await revalidate(hoteldata?.id as string);
        const url = new URLSearchParams(searchParams.toString());
        url.delete("qrScan");
        // router.replace("?" +url.toString());
      } catch (error) {
        console.error("Error handling QR scan:", error);
      }
    };

    const newUser = localStorage.getItem("newUser");
    if (newUser) {
      localStorage.removeItem("newUser");
      handleFollowAndUpdateUserVisits();
    }

    if (!userData) {
      if (qrScan) {
        isLoggedIn();
      }
      return;
    } else {
      if (qrScan) {
        handleFollowAndUpdateUserVisits();
      }
    }
  };

  useEffect(() => {
    const isFollowed =
      hoteldata?.followers?.some(
        (follower) => follower.user === (user?.uid ?? "?")
      ) ?? false;

    setIsFollowed(isFollowed);
  }, [hoteldata]);

  useEffect(() => {
    console.log(userData?.role, qrId, hoteldata?.id);
    if (
      userData?.role === "superadmin" &&
      qrId &&
      (error === "hotel_not_assigned" || !hoteldata?.id)
    ) {
      setShowQrAssignModal(true);
    }

    if (userData?.role != "superadmin") {
      handleQrScan();
    }
  }, [userData?.role, qrId, error, hoteldata?.id]);

  return (
    <main className="overflow-x-hidden bg-gradient-to-b from-orange-50 to-orange-100 relative">
      {userData?.role === "superadmin" && qrId && (
        <QrHotelAssignmentModal
          qrId={qrId || ""}
          currentHotelId={hoteldata?.id || null}
          currentHotelName={hoteldata?.hotelName || null}
          isOpen={showQrAssignModal}
          onClose={() => {
            setShowQrAssignModal(false);
          }}
          onButtonClick={() => setShowQrAssignModal(true)}
        />
      )}

      {hoteldata ? (
        <>
          <Dialog open={showAuthModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>SignIn Required</DialogTitle>
                <DialogDescription>
                  Please sign in to continue
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  className="bg-orange-600 hover:bg-orange-500 border-none outline-none"
                  onClick={() => {
                    localStorage.setItem("previousRoute", pathname);
                    router.push("/login");
                    setShowAuthModal(false);
                  }}
                >
                  Ok
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* banner Image  */}
          <div className="w-screen h-[200px] absolute top-0 z-0">
            <Image
              src={offers[0]?.dishImage ?? menu[0]?.image}
              alt={offers[0]?.dishName ?? menu[0]?.name}
              fill
              className="w-auto h-auto object-cover"
            />

            <div
              onClick={() => router.back()}
              className="absolute cursor-pointer top-3 left-3 sm:top-7 sm:left-10 text-white z-[50] bg-orange-600 rounded-full p-2"
            >
              <ArrowLeft width={30} height={30} />
            </div>
          </div>

          {/* offers listing  */}
          <div className="relative max-w-7xl mx-auto px-3 pb-[80px] bg-gradient-to-b from-orange-50 to-orange-100 pt-[20px] mt-[160px] lg:mt-[200px] rounded-t-3xl">
            <div className="lg:hidden bg-orange-200 h-2 w-[20%] rounded-full absolute top-4 left-1/2 -translate-x-1/2" />

            {/* hotel name  */}
            <div className="flex justify-between pt-5 md:pt-10">
              <h1 className="text-lg relative flex lg:items-center max-w-[50%] md:text-3xl font-semibold  capitalize">
                <span>{hoteldata?.hotelName}</span>
                <VerifiedIcon className="ml-2 text-green-600" />
              </h1>

              <Button
                onClick={async () => {
                  try {
                    if (isFollowed) {
                      await handleUnfollow(hoteldata?.id as string);
                      toast.error("Unfollowed successfully");
                      await revalidate(hoteldata?.id as string);
                    } else {
                      if (user) {
                        await handleFollow(hoteldata?.id as string);
                        toast.success("Followed successfully");
                        await revalidate(hoteldata?.id as string);
                      } else {
                        setShowAuthModal(true);
                      }
                    }
                  } catch (error) {
                    console.error("Error following/unfollowing:", error);
                    toast.error("An error occurred. Please try again.");
                  }
                }}
                className="bg-orange-600 hover:bg-orange-500"
              >
                {isFollowed ? "Unfollow" : "Follow"}
              </Button>
            </div>

            {/* hotel details  */}
            <div className="pb-5 md:pb-10 pt-2 grid gap-2">
              <div className="flex items-center gap-2 text-black/60 text-sm w-fit">
                <span className="flex items-center gap-1">
                  {" "}
                  <Users size={20} /> Followers :{" "}
                </span>{" "}
                <span>{hoteldata?.followers?.length ?? 0}</span>
              </div>

              <div
                onClick={() => router.push(hoteldata?.location ?? "")}
                className="flex items-center gap-2 text-black/60 text-sm w-fit"
              >
                <span className="flex items-center gap-1">
                  {" "}
                  <MapPin size={20} /> Area :{" "}
                </span>{" "}
                <span>{hoteldata?.area}</span>{" "}
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
                          <Link
                            href={"/offers/" + offer.id}
                            key={offer.id}
                            className="group"
                          >
                            <OfferCardMin discount={discount} offer={offer} />
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
        </>
      ) : (
        <Error />
      )}
    </main>
  );
};

export default HotelMenuPage;
