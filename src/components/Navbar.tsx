"use client";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { UtensilsCrossed, Menu, X, Banknote, ChevronLeft, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
// import { useClaimedOffersStore } from "@/store/claimedOffersStore";
import LocationAccess from "./LocationAccess";
import { FeatureFlags } from "@/screens/HotelMenuPage_v2";
import { getFeatures } from "@/lib/getFeatures";
// import SyncUserOfferCoupons from "./SyncUserOfferCoupons";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const location = pathname.split("?")[0];
  const { userData } = useAuthStore(); // Now we only use userData
  // const { offersClaimable } = useClaimedOffersStore();
  const [isOpen, setIsOpen] = useState(false);
  const [userLocation, setUserLocation] = useState("");
  // const [isTooltipOpen, setIsTooltipOpen] = useState(true);
  const [features, setFeatures] = useState<FeatureFlags | null>(null);

  useEffect(() => {
    if (userData?.role === "partner") {
      console.log("User Data:", userData?.role, userData?.feature_flags);

      const feature = getFeatures(userData?.feature_flags as string);

      setFeatures(feature);
    }
  }, [userData]);

  // Add array of paths where navbar should be hidden
  const hiddenPaths = [
    "/hotels/[id]/reviews/new",
    "/hotels/[id]/reviews",
    "/hotels/[id]/menu/[mId]/reviews/new",
    "/hotels/[id]/menu/[mId]/reviews",
    "/qrScan/[...id]",
  ];

  // Check if current path matches any hidden path pattern
  const shouldHideNavbar = hiddenPaths.some((path) => {
    // Convert path pattern to regex
    const pattern = path.replace(/\[.*?\]/g, "[^/]+");
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(location);
  });

  useEffect(() => {
    const location = localStorage.getItem("loc");
    if (location) {
      setUserLocation(location);
    }
  }, [userData]); // Only depend on userData now

  const NavLinks = () => (
    <>
      {[
        {
          href: `/offers`,
          label: "Offers",
        },
        {
          href: "/explore",
          label: "Explore",
        },
        ...(userData?.role === "partner"
          ? [
              { href: "/admin", label: "Admin" },
              ...((features?.ordering.access || features?.delivery.access) &&
              userData?.status === "active"
                ? [{ href: "/admin/orders", label: "Orders" }]
                : []),
              // ...((features?.ordering.access || features?.delivery.access ) && (userData?.status === "active")
              //   ? [{ href: "/admin/pos", label: "POS" }]
              //   : []),
            ]
          : []),
        ...(userData?.role === "superadmin"
          ? [{ href: "/superadmin", label: "Super Admin" }]
          : []),
        ...(userData?.role === "user"
          ? [{ href: "/my-orders", label: "My Orders" }]
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
      {!userData && (
        <Link href="/partner" onClick={() => setIsOpen(false)}>
          <Button className="text-white font-medium bg-orange-600 hover:bg-orange-50 hover:border-orange-600 hover:text-orange-600 px-5 text-[1rem] py-3 rounded-full transition-all duration-300">
            Partner with Us
          </Button>
        </Link>
      )}
      {userData && (
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
              <span>
                {userData.role === "user"
                  ? userData.full_name
                  : userData.role === "partner"
                  ? userData.store_name
                  : "Super Admin"}
              </span>
            </Link>
          </div>
        </div>
      )}
    </>
  );

  if (shouldHideNavbar) {
    return null;
  }

  return (
    <>
      {/* <Suspense>
        <SyncUserOfferCoupons />
        <LocationAccess />
      </Suspense> */}
      <nav className="w-full bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div
                onClick={() => {
                  router.back();
                }}
                className="flex items-center space-x-2"
              >
                {pathname === "/offers" ||
                pathname === "/explore" ||
                pathname === "/" ? (
                  <>
                    <UtensilsCrossed className="h-6 w-6 text-orange-600" />

                    <div className="relative">
                      <span className="text-xl font-bold text-gray-900">
                        Cravings
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <ChevronLeft className="h-6 w-6 text-orange-600" />

                    <div className="relative">
                      <span className="text-xl font-bold text-gray-900">
                        Back
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-5">
              {/* Print button */}
              {userData && (
                <Button
                  onClick={() => router.push("/print-test")}
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Printer className="h-6 w-6" />
                  <span className="sr-only">Print</span>
                </Button>
              )}

              {!userData && (
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
                  <SheetContent
                    side="right"
                    className="w-[80%] sm:w-[385px] z-[52]"
                  >
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
    </>
  );
}
