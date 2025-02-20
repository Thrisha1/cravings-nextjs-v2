"use client";
import React, { Suspense, useEffect, useState } from "react";
import NoOffersFound from "@/components/NoOffersFound";
import SearchBox from "@/components/SearchBox";
import Image from "next/image";
import { Offer } from "@/store/offerStore";
import { useAuthStore, UserData } from "@/store/authStore";
import OfferCardMin from "@/components/OfferCardMin";
import {
  ArrowLeft,
  MapPin,
  Users,
  VerifiedIcon,
  Star,
  History,
} from "lucide-react";
import MenuItemCard from "@/components/MenuItemCard";
import { useRouter, useSearchParams } from "next/navigation";
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
import VisitModal from "@/components/VisitModal";
import ShowAllBtn from "@/components/hotelDetail/ShowAllBtn";
import ReviewsList from "@/components/hotelDetail/ReviewsList";
import RateThis from "@/components/RateThis";
import { useReviewsStore } from "@/store/reviewsStore";
import PaymentHistoryModal from "@/components/PaymentHistoryModal";
import { UpiData } from "@/store/authStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  collection,
  DocumentData,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type MenuItem = {
  description: string;
  id: string;
  image: string;
  name: string;
  price: number;
};

interface HotelMenuPageProps {
  offers: Offer[];
  hoteldata: UserData;
  qrScan: string | null;
  upiData: UpiData | null;
}

const HotelMenuPage = ({
  offers,
  hoteldata,
  qrScan,
  upiData,
}: HotelMenuPageProps) => {
  const {
    user,
    userData,
    fetchUserVisit,
    handleFollow,
    handleUnfollow,
    userVisit,
    signInWithPhone,
  } = useAuthStore();
  const router = useRouter();
  const [isFollowed, setIsFollowed] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showQrAssignModal, setShowQrAssignModal] = useState(false);
  const searchParams = useSearchParams();
  const qrId = searchParams.get("qid");
  const error = searchParams.get("error");
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showAllOffers, setShowAllOffers] = useState(false);
  const { getAverageReviewByHotelId } = useReviewsStore();
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [userPhone, setUserPhone] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [totalMenuItems , setTotalMenuItems] = useState(0);

  const fetchMenuItems = async (isInitial: boolean) => {
    try {
      const menuRef = collection(db, "menuItems");
  
      // Use the correct field for filtering
      let q = query(
        menuRef,
        where("hotelId", "==", hoteldata.id),
        orderBy("name"),
        limit(4)
      );
  
      if (!isInitial && lastVisible) {
        q = query(
          menuRef,
          where("hotelId", "==", hoteldata.id), // Check if this should be "hotelId"
          orderBy("name"),
          startAfter(lastVisible),
          limit(4)
        );
      }
  
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
  
      // Extract menu array from document
      const menuItems = querySnapshot.docs.map((doc) => {
        return {
          id: doc.id,
          ...doc.data()
        } as MenuItem;
      });

  
      setMenu((prevMenu: MenuItem[]) => (isInitial ? menuItems : [...prevMenu, ...menuItems]));
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  const getMenuItemsCount = async () => {
    try {
      const menuRef = collection(db, "menuItems");
      const q = query(menuRef, where("hotelId", "==", hoteldata.id));
      const snapshot = await getCountFromServer(q);
      setTotalMenuItems(snapshot.data().count);
    } catch (error) {
      console.error("Error fetching menu items count:", error);
      return 0;
    }
  };
  
  

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
    const handleFollowUpdate = async () => {
      try {
        await handleFollow(hoteldata?.id as string);
        await fetchUserVisit(user?.uid as string, hoteldata?.id as string);
        toast.success("Following");
        await revalidate(hoteldata?.id as string);
        const url = new URLSearchParams(searchParams.toString());
        url.delete("qrScan");
        router.replace("?" + url.toString());
        setShowVisitModal(true);
      } catch (error) {
        console.error("Error handling QR scan:", error);
      }
    };

    const newUser = localStorage.getItem("newUser");
    if (newUser) {
      localStorage.removeItem("newUser");
      handleFollowUpdate();
    }

    if (!userData) {
      if (qrScan) {
        isLoggedIn();
      }
      return;
    } else {
      if (qrScan) {
        handleFollowUpdate();
      }
    }
  };

  useEffect(() => {
    const isFollowed =
      hoteldata?.followers?.some(
        (follower) => follower.user === (user?.uid ?? "?")
      ) ?? false;

    setIsFollowed(isFollowed);
  }, [hoteldata, user?.uid]);

  useEffect(() => {
    localStorage.removeItem("previousRoute");
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

  const displayedOffers = showAllOffers ? offers : offers.slice(0, 4);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedPhone = userPhone.replace(/^\+91/, "");
    if (cleanedPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsAuthLoading(true);
    try {
      await signInWithPhone(cleanedPhone);
      setShowAuthModal(false);
      if (qrScan) {
        handleQrScan();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && "Failed to sign in";
      toast.error(errorMessage);
    } finally {
      setIsAuthLoading(false);
    }
  };

  useEffect(()=>{
    getMenuItemsCount();
    fetchMenuItems(true);
  },[])

  return (
    <main className="overflow-x-hidden bg-gradient-to-b from-orange-50 to-orange-100 relative">
      <Suspense>
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

        {userVisit && qrId && (
          <VisitModal
            isOpen={showVisitModal}
            hotelId={hoteldata?.id as string}
            hotelData={hoteldata}
            onClose={() => setShowVisitModal(false)}
            numberOfVisits={userVisit.numberOfVisits}
            isRecentVisit={userVisit.isRecentVisit}
            lastDiscountedVisit={userVisit.lastDiscountedVisit}
            upiData={upiData}
          />
        )}
      </Suspense>

      {hoteldata ? (
        <>
          <Dialog open={showAuthModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sign In Required</DialogTitle>
                <DialogDescription>
                  Please sign in with your phone number to continue
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={userPhone}
                    onChange={(e) =>
                      setUserPhone(
                        e.target.value.replace(/\D/g, "").slice(0, 10)
                      )
                    }
                    required
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-500 border-none outline-none"
                    disabled={isAuthLoading}
                  >
                    {isAuthLoading ? "Please wait..." : "Sign In"}
                  </Button>
                </DialogFooter>
              </form>
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
                      setIsFollowed(false); // Immediately toggle state
                      await handleUnfollow(hoteldata?.id as string);
                      toast.error("Unfollowed successfully");
                      await revalidate(hoteldata?.id as string);
                    } else {
                      if (user) {
                        setIsFollowed(true); // Immediately toggle state
                        await handleFollow(hoteldata?.id as string);
                        toast.success("Followed successfully");
                        await revalidate(hoteldata?.id as string);
                      } else {
                        setShowAuthModal(true);
                      }
                    }
                  } catch (error) {
                    // Revert state if operation fails
                    setIsFollowed(!isFollowed);
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

              {/* ratings  */}
              <Suspense>
                <div className="flex items-center  gap-2 text-black/60 text-sm w-fit">
                  <Star className="text-orange-600 fill-orange-600" size={20} />
                  {getAverageReviewByHotelId(hoteldata?.id as string)}
                </div>
              </Suspense>
            </div>

            {qrId && (
              <div>
                {userVisit && (
                  <Button
                    onClick={() => setShowVisitModal(true)}
                    className="bg-orange-600 hover:bg-orange-500 w-full text-white block mb-4"
                  >
                    Get Discount
                  </Button>
                )}
                <Button
                  onClick={() => setShowPaymentHistory(true)}
                  className="bg-orange-600 hover:bg-orange-500 w-full text-white block mb-4"
                >
                  Payment History
                </Button>
              </div>
            )}

            <SearchBox />

            {/* available offer  */}
            {offers.length > 0 && (
              <section>
                <h1 className="text-lg relative flex max-w-[50%] md:text-3xl font-semibold pt-5 capitalize">
                  Available Offers
                </h1>

                <section className="my-5 md:my-10">
                  <>
                    <div
                      className={`grid transition-all duration-500 gap-2 gap-y-5 grid-cols-2 md:grid-cols-4 md:gap-x-5 md:gap-y-10`}
                    >
                      {displayedOffers.map((offer: Offer) => {
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
                    {offers.length > 4 && (
                      <ShowAllBtn
                        showAll={showAllOffers}
                        onClick={() => setShowAllOffers(!showAllOffers)}
                      />
                    )}
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
                    <div className="grid gap-2 gap-y-5 grid-cols-2 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
                      {menu.map((menuItem: MenuItem) => {
                        return (
                          <div key={menuItem.id} className="group">
                            <MenuItemCard
                              menuItem={menuItem}
                              hotelId={hoteldata?.id as string}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {menu.length < totalMenuItems && (
                      <ShowAllBtn
                        showAll={false}
                        onClick={() => {
                          fetchMenuItems(false);
                        }}
                      />
                    )}
                  </>
                ) : (
                  <NoOffersFound />
                )}
              </section>
            </section>

            {/* rate this hotel  */}
            <section className="px-3 pt-10 pb-5 flex sm:justify-center sm:pt-20 sm:pb-10">
              <RateThis type="hotel" />
            </section>

            {/* reviews  */}
            <section className="px-3 pt-5 pb-10 ">
              <ReviewsList hotelId={hoteldata?.id as string} />
            </section>

            {/* Add this after the hotel info section */}
            <div className="flex items-center gap-2 mt-4">
              <Button
                variant="ghost"
                onClick={() => setShowPaymentHistory(true)}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <History className="w-5 h-5" />
                <span>Payment History</span>
              </Button>
            </div>
          </div>

          {/* Add PaymentHistoryModal */}
          <PaymentHistoryModal
            isOpen={showPaymentHistory}
            onClose={() => setShowPaymentHistory(false)}
            hotelData={hoteldata}
            userId={user?.uid as string}
            upiData={upiData}
          />
        </>
      ) : (
        <Error />
      )}
    </main>
  );
};

export default HotelMenuPage;
