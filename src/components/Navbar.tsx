"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { UtensilsCrossed, LogOut, Menu, X, Bell } from "lucide-react";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "./ui/tooltip";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { PartnerDialog } from "./PartnerDialog";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const location = pathname.split("?")[0];
  const { user, userData, signOut, updateUserData } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ fullname: "", phone: "" });

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }

    // Check if the user needs to provide full name and phone
    if (user && (!userData?.fullName || !userData?.phone)) {
      setShowModal(true);
    }
  }, [user, userData]);

  const handleFormSubmit = () => {
    const phoneRegex = /^\d{10}$/;
    if (formData.fullname && phoneRegex.test(formData.phone)) {
      if (user) {
        try {
          updateUserData(user.uid, {
            fullName: formData.fullname,
            phone: formData.phone,
          });
        } catch (error) {
          console.error(error);
        }
      }
      setShowModal(false);
    } else {
      alert("Please enter a valid 10-digit phone number.");
    }
  };

  const requestNotificationPermission = async () => {
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const NavLinks = () => (
    <>
      {[
        { href: "/offers", label: "Offers" },
        ...(userData?.role === "hotel"
          ? [{ href: "/admin", label: "Admin" }]
          : []),
        ...(userData?.role === "superadmin"
          ? [{ href: "/superadmin", label: "Super Admin" }]
          : []),
      ].map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={() => setIsOpen(false)}
          className={cn(
            "inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors",
            location === link.href
              ? "text-orange-600 border-b-2 border-orange-600"
              : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
          )}
        >
          {link.label}
        </Link>
      ))}
      {!user && <PartnerDialog />}
      {user && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            signOut();
            setIsOpen(false);
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      )}
    </>
  );

  return (
    <>
      <nav className="w-full bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/offers" className="flex items-center space-x-2">
                <UtensilsCrossed className="h-6 w-6 text-orange-600" />
                <span className="text-xl font-bold text-gray-900">
                  Cravings
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-5">
              {notificationPermission !== "granted" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div
                        onClick={requestNotificationPermission}
                        className="text-red-500 hover:text-gray-700 relative group"
                      >
                        <Bell className="h-5 w-5 animate-bounce group-hover:animate-none transition-all" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-gray-400">Enable notification</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {!user && (
                <Button
                  onClick={() => router.push("/login")}
                  size="lg"
                  variant="outline"
                  className="text-white font-medium bg-orange-600 hover:bg-orange-50 hover:border-orange-600 hover:text-orange-600 px-5 text-[1rem] py-3 rounded-full transition-all duration-300 "
                >
                  Sign In
                </Button>
              )}

              <div className="hidden md:flex items-center space-x-8">
                <NavLinks />
              </div>

              <div className="md:hidden flex items-center">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[80%] sm:w-[385px]">
                    <div className="flex flex-col space-y-4 mt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <UtensilsCrossed className="h-6 w-6 text-orange-600" />
                          <span className="text-xl font-bold text-gray-900">
                            Cravings
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsOpen(false)}
                        >
                          <X className="h-6 w-6" />
                        </Button>
                      </div>
                      <div className="flex flex-col space-y-4">
                        <NavLinks />
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {showModal && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-orange-600">
                Complete Your Profile
              </DialogTitle>
              <DialogDescription>
                Please provide your full name and phone number to continue.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Full Name"
                value={formData.fullname}
                className="focus-visible:ring-orange-600"
                onChange={(e) =>
                  setFormData({ ...formData, fullname: e.target.value })
                }
              />
              <Input
                placeholder="Phone Number"
                value={formData.phone}
                className="focus-visible:ring-orange-600"
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button
                className="bg-orange-600 hover:bg-orange-500"
                onClick={handleFormSubmit}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
