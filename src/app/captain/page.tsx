"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, PlusCircle } from "lucide-react";
import Link from "next/link";
import CaptainOrdersTab from "./CaptainOrdertab";

export default function CaptainDashboard() {
  const router = useRouter();
  const { signOut } = useAuthStore();

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
          <Link href="/captain/pos">
            <Button 
              className="flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto"
              onClick={() => {
                router.push("/captain/pos");
              }}
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Create New Order</span>
              <span className="sm:hidden">New Order</span>
            </Button>
          </Link>
        </div>

        {/* Orders Management */}
        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="flex-none p-3 sm:p-3">
            <CardTitle className="text-lg sm:text-xl">All Orders</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <CaptainOrdersTab />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
