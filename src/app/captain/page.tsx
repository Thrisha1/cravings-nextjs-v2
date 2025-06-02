"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, PlusCircle, X } from "lucide-react";
import Link from "next/link";
import CaptainOrdersTab from "./CaptainOrdertab";
import { CaptainPOS } from "./pos/CaptainPOS";
import { Captaincart } from "./pos/Captaincart";
import { CaptainCheckoutModal } from "./pos/CaptainCheckoutModal";
import { EditCaptainOrderModal } from "./pos/EditCaptainOrderModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { usePOSStore } from "@/store/posStore";

export default function CaptainDashboard() {
  const router = useRouter();
  const { signOut } = useAuthStore();
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const { cartItems } = usePOSStore();

  const handleSignOut = () => {
    signOut();
    router.push("/captainlogin");
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Fixed Header */}
      <div className="flex-none p-3 sm:p-4 border-b bg-white">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-xl sm:text-2xl font-bold">Captain Dashboard</h1>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex items-center gap-2 text-sm sm:text-base"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto p-2 sm:p-4 overflow-hidden flex flex-col">
        {/* Create New Order Button */}
        <div className="flex-none flex justify-end mb-3 sm:mb-4">
          <Button 
            className="flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto"
            onClick={() => setIsPOSOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Create New Order</span>
            <span className="sm:hidden">New Order</span>
          </Button>
        </div>

        {/* Orders Management */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="flex-none p-3 sm:p-4">
            <CardTitle className="text-lg sm:text-xl">All Orders</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <CaptainOrdersTab />
          </CardContent>
        </Card>
      </div>

      {/* POS Overlay */}
      {isPOSOpen && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex-none p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create New Order</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (cartItems.length > 0) {
                    toast.error("Please complete or cancel the current order first");
                    return;
                  }
                  setIsPOSOpen(false);
                }}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <CaptainPOS />
            </div>
            <div className="flex-none border-t">
              <Captaincart />
            </div>
          </div>
          <div className="flex-none flex justify-end gap-2 px-4 py-3 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                if (cartItems.length > 0) {
                  toast.error("Please complete or cancel the current order first");
                  return;
                }
                setIsPOSOpen(false);
              }}
              className="px-6 py-2 text-base font-semibold min-w-[120px] border-2 hover:bg-gray-100"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CaptainCheckoutModal />
      <EditCaptainOrderModal />
    </div>
  );
}
