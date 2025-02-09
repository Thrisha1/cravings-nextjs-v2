"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UtensilsCrossed } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useClaimedOffersStore } from "@/store/claimedOffersStore";
import Image from "next/image";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, signUp, error, signInWithGoogle } = useAuthStore();
  const navigate = useRouter();
  const { updateUserOffersClaimable } = useClaimedOffersStore();
  const searchParams = useSearchParams();
  const isApp = searchParams.get("app");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        const decryptedInviteToken = localStorage.getItem("token");
        await signUp(email, password, fullName, phoneNumber);
        if (decryptedInviteToken) {
          const inviteToken = JSON.parse(atob(decryptedInviteToken));
          if (inviteToken) {
            console.log("Invite token:", inviteToken);
            await updateUserOffersClaimable(inviteToken, 50); //give 50 offers to the user who invited
            localStorage.removeItem("token");

            await fetch(
              `${process.env.NEXT_PUBLIC_WWJS_API_URL}/whatsapp-to-user`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  to: inviteToken,
                  messageType: "invite-reward",
                  from: fullName,
                }),
              }
            ).catch((error) => {
              console.error("Error:", error);
            });
          }
        }
      } else {
        await signIn(email, password);
      }

      const redirectTo = localStorage.getItem("previousRoute") || "/";
      navigate.push(redirectTo);
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      const decryptedInviteToken = localStorage.getItem("token");
      if (decryptedInviteToken) {
        const inviteToken = JSON.parse(atob(decryptedInviteToken));
        if (inviteToken) {
          await updateUserOffersClaimable(inviteToken, 50);
          localStorage.removeItem("token");
        }
      }

      const redirectTo = localStorage.getItem("previousRoute") || "/";
      navigate.push(redirectTo);
    } catch (error) {
      console.error("Google authentication error:", error);
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
          <p className="text-gray-600 mt-2">
            {isSignUp ? "Create an account" : "Sign in to your account"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isSignUp}
                />
              </div>
              <div>
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required={isSignUp}
                />
              </div>
            </>
          )}
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {!isSignUp && (
              <div className="mt-1 text-right">
                <button
                  type="button"
                  onClick={() => navigate.push("/login/forgot-password")}
                  className="text-orange-600 hover:text-orange-700 text-sm"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>

        {!isApp && (
          <div>
            <div className="flex items-center justify-center py-5">
              <span className="w-1/3 h-px bg-gray-300"></span>
              <span className="text-gray-500 mx-4 text-[10px] text-nowrap">
                Or Continue with
              </span>
              <span className="w-1/3 h-px bg-gray-300"></span>
            </div>

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
          </div>
        )}

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-orange-600 hover:text-orange-700 text-sm"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
