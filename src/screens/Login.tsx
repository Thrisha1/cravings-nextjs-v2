"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import AskPhoneAndNameModal from "@/components/AskPhoneAndNameModal";

export default function Login() {
  const { signInWithGoogle, updateUserData, user } = useAuthStore();
  const navigate = useRouter();
  const searchParams = useSearchParams();
  const isApp = searchParams.get("app");
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [googleUserData, setGoogleUserData] = useState<{ fullName: string; phone: string }>({
    fullName: '',
    phone: ''
  });

  const handleGoogleSignIn = async () => {
    try {
      const userData = await signInWithGoogle();
      
      if (userData.needsPhoneNumber) {
        setGoogleUserData({
          fullName: userData.fullName,
          phone: ''
        });
        setShowPhoneModal(true);
      } else {
        const redirectTo = localStorage.getItem("previousRoute") || "/";
        navigate.push(redirectTo);
      }
    } catch (error) {
      console.error("Google authentication error:", error);
    }
  };

  const handlePhoneSubmit = async (phone: string, fullName: string) => {
    try {
      if (user) {
        await updateUserData(user.uid, {
          fullName: fullName,
          phone: phone
        });
      }
      setShowPhoneModal(false);
      
      const redirectTo = localStorage.getItem("previousRoute") || "/";
      navigate.push(redirectTo);
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg p-6">
        <div className="flex flex-col items-center mb-8">
          <UtensilsCrossed className="h-12 w-12 text-orange-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            Welcome to Cravings
          </h1>
          <p className="text-gray-600 mt-2">Sign in to continue</p>
        </div>

        {!isApp && (
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            <Image
              width={5}
              height={5}
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5 mr-2"
            />
            Sign in with Google
          </Button>
        )}

        {showPhoneModal && (
          <AskPhoneAndNameModal
            showModal={showPhoneModal}
            setShowModal={setShowPhoneModal}
            updateUserData={updateUserData}
            user={user}
            initialFullName={googleUserData.fullName}
            onSubmit={(phone) => handlePhoneSubmit(phone, googleUserData.fullName)}
          />
        )}
      </div>
    </div>
  );
}
