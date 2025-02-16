"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

type LoginMode = "user" | "partner";

export default function Login() {
  const { signInWithPhone, signInPartnerWithEmail, signInWithGooglePartner } = useAuthStore();
  const navigate = useRouter();
  const [mode, setMode] = useState<LoginMode>("user");
  const [isLoading, setIsLoading] = useState(false);
  
  const [userPhone, setUserPhone] = useState("");
  const [partnerData, setPartnerData] = useState({
    email: "",
    password: ""
  });

  const handleUserSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithPhone(userPhone);
      navigate.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePartnerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInPartnerWithEmail(partnerData.email, partnerData.password);
      navigate.push("/admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePartnerGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGooglePartner();
      navigate.push("/admin");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
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
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            type="button"
            onClick={() => setMode("user")}
            className={`flex-1 ${mode === "user" ? "bg-orange-600" : "bg-gray-200"}`}
          >
            Sign in as User
          </Button>
          <Button
            type="button"
            onClick={() => setMode("partner")}
            className={`flex-1 ${mode === "partner" ? "bg-orange-600" : "bg-gray-200"}`}
          >
            Sign in as Partner
          </Button>
        </div>

        {mode === "user" ? (
          <form onSubmit={handleUserSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={isLoading}
            >
              {isLoading ? "Please wait..." : "Continue"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handlePartnerSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={partnerData.email}
                  onChange={(e) => setPartnerData({ ...partnerData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={partnerData.password}
                  onChange={(e) => setPartnerData({ ...partnerData, password: e.target.value })}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isLoading}
              >
                {isLoading ? "Please wait..." : "Sign In"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handlePartnerGoogleSignIn}
              className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              disabled={isLoading}
            >
              {isLoading ? (
                "Please wait..."
              ) : (
                <>
                  <Image
                    width={5}
                    height={5}
                    src="https://www.google.com/favicon.ico"
                    alt="Google"
                    className="w-5 h-5 mr-2"
                  />
                  Sign in with Google
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
