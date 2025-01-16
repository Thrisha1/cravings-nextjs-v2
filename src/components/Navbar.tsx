"use client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  UtensilsCrossed,
  Menu,
  X,
  TicketPercent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { PartnerDialog } from "./PartnerDialog";
import AskPhoneAndNameModal from "./AskPhoneAndNameModal";
import Image from "next/image";
import { useClaimedOffersStore } from "@/store/claimedOffersStore";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const location = pathname.split("?")[0];
  const { user, userData, updateUserData } = useAuthStore();
  const { offersClaimable } = useClaimedOffersStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userLocation, setUserLocation] = useState("");

  useEffect(() => {
    if (
      user &&
      userData &&
      (!userData?.phone || (!userData?.fullName && !userData.hotelName))
    ) {
      setShowModal(true);
    }

    const location = localStorage.getItem("loc");
    if (location) {
      setUserLocation(location);
    }
  }, [user, userData]);

  const NavLinks = () => (
    <>
      {[
        { href: `/offers${userLocation}`, label: "Offers" },
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
        <div className="flex w-full">
          <div className="flex items-center gap-2 flex-col sm:flex-row justify-end">
            <Link
              onClick={() => setIsOpen(false)}
              className="flex text-sm items-center gap-2 text-gray-500"
              href="/profile"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
              <span>{userData?.fullName ?? userData?.hotelName}</span>
            </Link>
          </div>
        </div>
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

                <div className="relative">
                  <span className="text-xl font-bold text-gray-900">
                    Cravings
                  </span>
                  {/* <Image
                    src={"/christmas-hat.webp"}
                    alt="christmas hat"
                    width={30}
                    height={30}
                    className="absolute -top-2 -left-4 "
                  /> */}
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-5">
              {user && (
                <div onClick={()=>router.push('/coupons')} className="text-orange-500 gap-1 cursor-pointer font-bold flex items-center text-lg rounded-full">
                  <span>{offersClaimable}</span>
                  <TicketPercent className="w-8 h-8" />
                </div>
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
        <AskPhoneAndNameModal
          setShowModal={setShowModal}
          showModal={showModal}
          updateUserData={updateUserData}
          user={user}
        />
      )}
    </>
  );
}
