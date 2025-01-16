"use client";
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const CouponsPage = () => {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/offers");
      return;
    }
  }, [user]);

  const handleInvite = () => {
    const shareData = user?.uid;

    const encryptedData = btoa(JSON.stringify(shareData));

    const shareUrl = `${window.location.origin}/offers?token=${encryptedData}`;

    if (navigator.share) {
      navigator.share({
        title: "Cravings",
        text: "Join me on Cravings",
        url: shareUrl,
      });
    } else {
      alert('Share link copied to clipboard');
      navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <section className="bg-[#FFF6EB] min-h-screen grid place-content-center justify-items-center px-5 sm:px-[7.5%] lg:sm:px-[20%]">
      <div className="w-[250px] lg:w-[330px] aspect-square relative">
        <Image
          src={"/rewards.png"}
          alt="rewards"
          fill
          className="w-auto h-auto object-cover"
        />
      </div>

      <div className="text-center py-3">
        <h1 className="font-black text-2xl text-orange-600">Share & Earn Coupons</h1>
        <p className="text-sm text-black/50 pt-2">
          Love using Cravings? Share the joy with your friends and family! For
          every successful signup of the new user, you&apos;ll receive 1 exclusive
          coupon to enjoy delicious offers and more. Start sharing, start
          saving!
        </p>
      </div>

      <button className="text-white bg-orange-600 rounded-full px-4 py-2 mt-2 hover:bg-orange-500 active:scale-95" onClick={handleInvite}>Invite Friends</button>
    </section>
  );
};

export default CouponsPage;
