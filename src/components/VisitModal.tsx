"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDiscount, useAuthStore, UserData } from "@/store/authStore";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Link from "next/link";

interface VisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  numberOfVisits: number;
  isRecentVisit: boolean;
  hotelId: string;
}

const VisitModal = ({
  isOpen,
  onClose,
  numberOfVisits,
  isRecentVisit,
  hotelId,
}: VisitModalProps) => {
  const { user, updateUserVisits, fetchUserData } = useAuthStore();
  const [amount, setAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hotelData, setHotelData] = useState<UserData | null>(null);

  useEffect(() => {
    const getHotelData = async () => {
      if (hotelId) {
        const data = await fetchUserData(hotelId);
        setHotelData(data as UserData);
      }
    };
    getHotelData();
  }, [hotelId, fetchUserData]);

  const handleSubmit = async () => {
    if (!amount) return;

    setIsLoading(true);
    const discount = getDiscount(numberOfVisits + 1);
    setDiscount(discount);
    try {
      await updateUserVisits(
        user?.uid as string,
        hotelId,
        Number(amount),
        discount
      );
      setSubmitted(true);
    } catch (error) {
      console.error("Error updating visit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={discount || isRecentVisit ? onClose : () => {}}
    >
      <DialogContent className="w-[90%] sm:max-w-lg rounded-xl bg-gradient-to-br from-orange-50 to-white">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-center text-base font-bold text-orange-600">
            {isRecentVisit
              ? "⚠️ Already Scanned Today ⚠️"
              : "🎉 Thank you for visiting! 🎉"}
          </DialogTitle>
          <DialogDescription className="text-center space-y-4">
            {isRecentVisit ? (
              <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 shadow-inner">
                <p className="text-lg font-semibold text-gray-800">
                  You have already scanned today. Please come back tomorrow to
                  claim more offers!
                </p>
              </div>
            ) : (
              <>
                {!submitted ? (
                  <div className="bg-white/50 rounded-lg p-6 shadow-inner grid gap-2">
                    <p className="text-base text-start font-semibold text-gray-800">
                      Please enter the bill amount:
                    </p>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="text-center"
                    />
                    <Button
                      onClick={handleSubmit}
                      className="bg-orange-600 hover:bg-orange-500 w-full mt-2"
                      disabled={isLoading}
                    >
                      {isLoading ? "Submitting..." : "Submit"}
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white/50 backdrop-blur-sm rounded-lg p-6 shadow-inner grid gap-2">
                    <p className="text-xl font-semibold text-gray-800">
                      Congratulations! You got a{" "}
                      <span className="text-orange-600 text-3xl font-bold animate-pulse">
                        {discount}%
                      </span>{" "}
                      discount!
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Final amount: ₹
                      {Number(amount) - (Number(amount) * discount) / 100}
                    </p>
                    {hotelData?.upiId && (
                      <Link
                        href={`upi://pay?pa=${hotelData?.upiId}&pn=${
                          hotelData?.hotelName
                        }&am=${
                          Number(amount) - (Number(amount) * discount) / 100
                        }&cu=INR`}
                        className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-4 rounded"
                      >
                        Pay Now
                      </Link>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-orange-600">
                    🎁 See you soon! 🎁
                  </p>
                </div>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default VisitModal;
