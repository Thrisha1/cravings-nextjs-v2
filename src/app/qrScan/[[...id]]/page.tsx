"use client";

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { FileClock, UtensilsCrossed } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore, getDiscount } from "@/store/authStore";
import Link from "next/link";
import { toast } from "sonner";
import PartnerLoginModal from "@/components/PartnerLoginModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface hotelDetails {
  hotelId: string;
  hotelName: string;
  hotelArea: string;
}

interface UPIApp {
  name: string;
  icon: string;
  getUrl: (params: {
    upiId: string,
    merchantName: string,
    amount: number,
    transactionId: string
  }) => string;
}

const upiApps: UPIApp[] = [
  {
    name: "Google Pay",
    icon: "/google-pay.png",
    getUrl: ({ upiId, merchantName, amount, transactionId }) =>
      `gpay://upi/pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&tr=${transactionId}&tn=Payment%20to%20${encodeURIComponent(merchantName)}&am=${amount}&cu=INR`
  },
  {
    name: "PhonePe",
    icon: "/phonepay-icon.jpg",
    getUrl: ({ upiId, merchantName, amount, transactionId }) =>
      `phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&tr=${transactionId}&tn=Payment%20to%20${encodeURIComponent(merchantName)}&am=${amount}&cu=INR`
  },
  {
    name: "Paytm",
    icon: "/paytm-icon.jpg",
    getUrl: ({ upiId, merchantName, amount, transactionId }) =>
      `paytmmp://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&tr=${transactionId}&tn=Payment%20to%20${encodeURIComponent(merchantName)}&am=${amount}&cu=INR`
  }
];

const QrScanPage = () => {
  const [billAmount, setBillAmount] = useState<string>("");
  const [hotelDetails, setHotelDetails] = useState<hotelDetails>();
  const params = useParams();
  const ids = params.id as string[];
  const id = ids[0];
  const {
    user,
    signInWithPhone,
    fetchUserVisit,
    handleFollow,
    updateUserVisits,
    updateUserPayment,
  } = useAuthStore();
  const [isSignedIn, setIsSignedIn] = useState<boolean>(true);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRecentVisit, setIsRecentVisit] = useState<boolean>(false);
  const [discount, setDiscount] = useState<number>(0);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState<boolean>(false);
  const [showUpiErrorDialog, setShowUpiErrorDialog] = useState(false);
  const [showHotelPage, setShowHotelPage] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const router = useRouter();

  const getHotelDetails = async () => {
    try {
      if (id) {
        const qrCodeRef = doc(db, "qrcodes", id);
        const qrCodeSnap = await getDoc(qrCodeRef);

        if (qrCodeSnap.exists()) {
          const qrData = qrCodeSnap.data();
          setHotelDetails(qrData as hotelDetails);
        } else {
          throw new Error("QR code not found");
        }
      } else {
        throw new Error("ID is null");
      }
    } catch (error) {
      toast.error("Upi pyament not available");
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      setIsSignedIn(false);
      return;
    }

    try {
      setIsLoading(true);
      await handleFollow(hotelDetails?.hotelId as string);
      const uv = await fetchUserVisit(
        user.uid,
        hotelDetails?.hotelId as string
      );

      if (uv?.isRecentVisit) {
        setIsRecentVisit(true);
        setIsLoading(false);
        return;
      }

      const discount = await getDiscount(
        (uv?.numberOfVisits as number) + 1,
        uv?.lastDiscountedVisit as string | null
      );
      setDiscount(discount);
      const amount = billAmount.replace("₹", "");

      updateUserVisits(
        user.uid,
        hotelDetails?.hotelId as string,
        Number(amount),
        discount
      );

      setIsLoading(false);
    } catch (error) {
      console.error(error);
      toast.error(error as string);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!phoneNumber) {
      return;
    }
    try {
      let cleanedPhone = phoneNumber.replace("+91", "");
      cleanedPhone = cleanedPhone.replace(" ", "");
      if (cleanedPhone.length !== 10) {
        throw new Error("Invalid phone number");
      }
      setIsLoading(true);
      await signInWithPhone(cleanedPhone);
      setIsSignedIn(true);
    } catch (error) {
      console.error(error);
      toast.error(error as string);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayNow = async () => {
    try {
      setIsLoading(true);
      await updateUserPayment(
        user?.uid as string,
        hotelDetails?.hotelId as string
      );
      const upiRef = collection(db, "upi_ids");
      const q = query(
        upiRef,
        where("userId", "==", hotelDetails?.hotelId as string)
      );
      const upiDocSnap = await getDocs(q);
      if (!upiDocSnap.empty) {
        const upiData = upiDocSnap.docs[0].data();
        const upiId = upiData.upiId;
        setShowPaymentModal(true);
        setIsPaymentSuccess(true);
      } else {
        setShowUpiErrorDialog(true);
        setShowHotelPage(true);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUPIPayment = (app: UPIApp) => {
    setShowPaymentModal(false);
    
    const upiRef = collection(db, "upi_ids");
    const q = query(
      upiRef,
      where("userId", "==", hotelDetails?.hotelId as string)
    );
    getDocs(q).then((upiDocSnap) => {
      if (!upiDocSnap.empty) {
        const upiData = upiDocSnap.docs[0].data();
        const upiId = upiData.upiId;
        const finalAmount = Number(billAmount.replace("₹", "")) -
          (Number(billAmount.replace("₹", "")) * discount) / 100;

        const paymentUrl = app.getUrl({
          upiId,
          merchantName: hotelDetails?.hotelName || '',
          amount: finalAmount,
          transactionId: Date.now().toString()
        });
        
        window.location.href = paymentUrl;
      }
    });
  };

  useEffect(() => {
    getHotelDetails();
  }, []);

  return (
    <main className="px-[7.5%] pt-[12%] pb-[20%] bg-orange-600 h-[100dvh] flex flex-col overflow-hidden">
      <div className="flex justify-between items-start">
        {/* cravings title  */}
        <div className="flex flex-col gap-2 flex-1">
          {/* logo  */}
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-10 h-10 text-white" />
            <h1 className="text-white text-xl font-bold">Cravings</h1>
          </div>

          {/* short descritpion  */}
          <div className="text-white/80 font-medium text-[12px] mt-2">
            <p>Get discounts and offers in your favorite restaurants</p>
          </div>
        </div>

        {/* discount history button  */}
        <Link
          href={
            hotelDetails
              ? `${window.location.origin}/hotels/${hotelDetails?.hotelId}?qid=${id}`
              : ""
          }
          className={`${
            hotelDetails?.hotelId
              ? "cursor-pointer"
              : "w-36 h-8 animate-pulse cursor-default"
          } bg-white text-black px-4 py-2 rounded-full disabled:opacity-50 flex items-center gap-2`}
        >
          {hotelDetails?.hotelId ? (
            <>
              <FileClock className="w-4 h-4" />
              <p className="text-black font-medium text-[12px]">
                Discount History
              </p>
            </>
          ) : null}
        </Link>
      </div>

      {/* main section  */}
      <section className={`flex flex-col flex-1 justify-end`}>
        {isSignedIn ? (
          <>
            {discount > 0 || isRecentVisit ? (
              <div className="flex flex-col flex-1 justify-between items-center">
                <div></div>
                <div className="flex flex-col gap-2">
                  <h1 className="text-white text-8xl font-bold text-center">
                    ₹
                    {Number(billAmount.replace("₹", "")) -
                      Number(billAmount.replace("₹", "")) * (discount / 100)}
                  </h1>
                  {discount > 0 ? (
                    <h1 className="text-white/70 font-medium text-center">
                      Yay! You got a {discount}% discount
                    </h1>
                  ) : (
                    <h1 className="text-white/70 font-medium text-center">
                      Better luck next time with more discounts!
                    </h1>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    disabled={isLoading}
                    onClick={
                      isPaymentSuccess
                        ? () => {
                            router.push(
                              `${window.location.origin}/hotels/${hotelDetails?.hotelId}`
                            );
                          }
                        : handlePayNow
                    }
                    className="bg-white text-black px-4 w-full py-2 rounded-md disabled:opacity-50"
                  >
                    {isPaymentSuccess
                      ? "Go To Hotel Page"
                      : isLoading
                      ? "Processing..."
                      : "Pay Now"}
                  </button>

                  {showHotelPage && (
                    <button
                      onClick={() => {
                        router.push(`${window.location.origin}/hotels/${hotelDetails?.hotelId}`);
                      }}
                      className="bg-white text-black px-4 w-full py-2 rounded-md"
                    >
                      Go To Hotel Page
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-2 mt-5 flex-1 justify-between"
                >
                  <div />

                  <input
                    disabled={!hotelDetails}
                    id="billAmount"
                    name="billAmount"
                    value={billAmount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      if (value === "") {
                        setBillAmount("");
                      } else {
                        const formattedValue = `₹${value}`;
                        setBillAmount(formattedValue);
                      }
                    }}
                    type="text"
                    placeholder="₹0"
                    className="w-full p-2 rounded-md text-center text-6xl font-bold bg-transparent text-white placeholder:text-white/70 focus:outline-none "
                  />

                  <div className="w-full flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={
                          hotelDetails
                            ? `${window.location.origin}/hotels/${hotelDetails?.hotelId}`
                            : ""
                        }
                        className={`text-black bg-white rounded-full px-3 py-2 text-[12px] capitalize flex items-center gap-1 font-medium ${
                          hotelDetails
                            ? "w-fit cursor-pointer select-none"
                            : "h-8 w-[40%] animate-pulse cursor-default"
                        }`}
                      >
                        {hotelDetails ? (
                          <>
                            <UtensilsCrossed className="w-4 h-4" />
                            View Menu
                          </>
                        ) : null}
                      </Link>
                      <h1 className="text-white text-4xl font-bold capitalize">
                        {hotelDetails?.hotelName ? (
                          <>{hotelDetails?.hotelName}</>
                        ) : (
                          <div className="bg-white w-[80%] h-8 rounded-full animate-pulse" />
                        )}
                      </h1>
                      <div className="text-white/80 text-sm capitalize">
                        {hotelDetails?.hotelArea ? (
                          <>{hotelDetails?.hotelArea}</>
                        ) : (
                          <div className="bg-white/50 w-[30%] h-5 rounded-full animate-pulse" />
                        )}
                      </div>
                    </div>
                    <button
                      disabled={!hotelDetails || !billAmount || isLoading}
                      type="submit"
                      className="bg-white text-black px-4 py-2 rounded-md disabled:opacity-50"
                    >
                      {isLoading ? "Discounting..." : "Get Discount"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </>
        ) : (
          <>
            {/* Headings  */}
            <div className="flex flex-col gap-1">
              <h1 className="text-white text-4xl font-bold">
                New To Cravings?
              </h1>
              <div className="text-white/80 text-sm">
                Sign in to get discounts and offers
              </div>
            </div>

            {/* bill input  */}
            <form onSubmit={handleSignIn} className="flex flex-col gap-2 mt-5">
              <input
                id="phoneNumber"
                name="phoneNumber"
                value={phoneNumber}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9]/g, "");
                  if (value.startsWith("91")) {
                    value = value.slice(2);
                  }
                  const formattedValue = `+91 ${value}`;
                  setPhoneNumber(formattedValue);
                }}
                type="text"
                placeholder="Enter phone number"
                className="w-full p-2 rounded-md bg-white/10 text-white placeholder:text-white/70 focus:outline-none focus:border-white border-2 border-transparent"
              />
              <button
                disabled={!phoneNumber || isLoading}
                type="submit"
                className="bg-white text-black px-4 py-2 rounded-md disabled:opacity-50"
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          </>
        )}
      </section>
      
      <PartnerLoginModal />

      <Dialog open={showUpiErrorDialog} onOpenChange={setShowUpiErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>UPI Payment Unavailable</DialogTitle>
            <DialogDescription>
              UPI payment option is not available right now. Please use cash or card instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => setShowUpiErrorDialog(false)}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
            <DialogDescription>
              Select your preferred UPI payment app
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {upiApps.map((app) => (
              <Button 
                key={app.name}
                onClick={() => handleUPIPayment(app)}
                className="w-full bg-white hover:bg-gray-100 text-black border flex items-center justify-center gap-2"
              >
                <img src={app.icon} alt={app.name} className="w-6 h-6" />
                Pay with {app.name}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowPaymentModal(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default QrScanPage;
