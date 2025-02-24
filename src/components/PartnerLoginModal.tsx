"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PartnerLoginModal() {
  const { signInPartnerWithEmail, signInWithGooglePartner, showPartnerLoginModal } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [partnerData, setPartnerData] = useState({
    email: "",
    password: "",
  });

  // Get the setter from the store
  const setShowPartnerLoginModal = useAuthStore(state => state.setShowPartnerLoginModal);

  const handlePartnerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInPartnerWithEmail(partnerData.email, partnerData.password);
      setShowPartnerLoginModal(false);
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
      setShowPartnerLoginModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={showPartnerLoginModal} onOpenChange={setShowPartnerLoginModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Partner Sign In</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <form onSubmit={handlePartnerSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={partnerData.email}
                onChange={(e) =>
                  setPartnerData({ ...partnerData, email: e.target.value })
                }
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
                onChange={(e) =>
                  setPartnerData({ ...partnerData, password: e.target.value })
                }
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
      </DialogContent>
    </Dialog>
  );
} 