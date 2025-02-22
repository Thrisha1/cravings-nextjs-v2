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

interface hotelDetails {
  hotelId: string;
  hotelName: string;
  hotelArea: string;
}

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

        const paymentLink = `upi://pay?pa=${upiId}&pn=${
          hotelDetails?.hotelName
        }&am=${
          Number(billAmount.replace("₹", "")) -
          (Number(billAmount.replace("₹", "")) * discount) / 100
        }&cu=INR`;
        window.open(paymentLink, "_blank");
        setIsPaymentSuccess(true);
      } else {
        throw new Error("UPI ID not found for the hotel");
      }
    } catch (error) {
      console.error(error);
      toast.error(error as string);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getHotelDetails();
  }, []);

  return (
    <main className="px-[7.5%] pt-[12%] pb-[20%] bg-orange-600 h-screen flex flex-col">
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
            {discount > 0 ? (
              <div className="flex flex-col flex-1 justify-between items-center">
                <div></div>
                <div className="flex flex-col gap-2">
                  <h1 className="text-white text-8xl font-bold text-center">
                    ₹
                    {Number(billAmount.replace("₹", "")) -
                      Number(billAmount.replace("₹", "")) * (discount / 100)}
                  </h1>
                  <h1 className="text-white/70 font-medium text-center">
                    Yay! You got a {discount}% discount
                  </h1>
                </div>

                <button
                  disabled={isLoading}
                  onClick={isPaymentSuccess ? () => {
                    router.push(`${window.location.origin}/hotels/${hotelDetails?.hotelId}`);
                  } : handlePayNow}
                  className="bg-white text-black px-4 w-full py-2 rounded-md disabled:opacity-50"
                >
                  {isPaymentSuccess
                    ? "Go To Hotel Page"
                    : isLoading
                    ? "Processing..."
                    : "Pay Now"}
                </button>
              </div>
            ) : (
              <>
                {isRecentVisit ? (
                  <div className="flex flex-col gap-2">
                    <h1 className="text-white text-6xl font-bold">Sorry!</h1>
                    <div className="text-white/80 text-sm">
                      You have already claimed your discount for this restaurant
                      today
                    </div>
                    <button
                      className="bg-white text-black px-4 py-2 rounded-md disabled:opacity-50 mt-5"
                      onClick={() => {
                        setIsRecentVisit(false);
                        setBillAmount("");
                      }}
                    >
                      Back
                    </button>
                  </div>
                ) : (
                  <>
                    {/* hotel details  */}
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

                    {/* bill input  */}
                    <form
                      onSubmit={handleSubmit}
                      className="flex flex-col gap-2 mt-5"
                    >
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
                        placeholder="Enter bill amount"
                        className="w-full p-2 rounded-md bg-white/10 text-white placeholder:text-white/70 focus:outline-none focus:border-white border-2 border-transparent"
                      />
                      <button
                        disabled={!hotelDetails || !billAmount || isLoading}
                        type="submit"
                        className="bg-white text-black px-4 py-2 rounded-md disabled:opacity-50"
                      >
                        {isLoading ? "Discounting..." : "Get Discount"}
                      </button>
                    </form>
                  </>
                )}
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
    </main>
  );
};

export default QrScanPage;
