"use client";
import { useAuthStore } from "@/store/authStore";
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
      navigator.clipboard.writeText(shareUrl);
    }
  }

  return (
    <div onClick={handleInvite}>
      <div>Share</div>
    </div>
  );
};

export default CouponsPage;
