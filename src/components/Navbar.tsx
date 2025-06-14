"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  UtensilsCrossed,
  ChevronLeft,
  Download,
  ShoppingBag,
  UserCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { useAuthStore } from "@/store/authStore";
import { FeatureFlags, getFeatures } from "@/lib/getFeatures";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAuthCookie } from "@/app/auth/actions";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const HIDDEN_PATHS = [
  "/hotels/[id]/reviews/new",
  "/hotels/[id]/reviews",
  "/hotels/[id]/menu/[mId]/reviews/new",
  "/hotels/[id]/menu/[mId]/reviews",
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { userData } = useAuthStore();
  const [features, setFeatures] = useState<FeatureFlags | null>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const currentPath = pathname.split("?")[0];

  useEffect(() => {

    const isApp = window.localStorage.getItem("isApp");
    if (isApp === "true") {
      setIsInstalled(true);
    } else {
      setIsInstalled(false);
    }

    console.log(isInstalled, isApp);
    

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    if (userData?.role === "partner") {
      const feature = getFeatures(userData?.feature_flags as string);
      setFeatures(feature);
    }
  }, [userData]);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      toast.success("App installed successfully!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      toast.info(
        "To install the app on iOS:\n1. Tap the Share button\n2. Scroll down and tap 'Add to Home Screen'",
        { duration: 5000 }
      );
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("App installed successfully!");
      }
      setDeferredPrompt(null);
    } else {
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;
      if (isStandalone) {
        window.location.reload();
      } else {
        toast.info(
          "To install the app:\n1. Open your browser menu\n2. Look for 'Install App' or 'Add to Home Screen'\n3. Follow the prompts to install",
          { duration: 5000 }
        );
      }
    }
  };

  const shouldHideNavbar = HIDDEN_PATHS.some((path) => {
    const pattern = path.replace(/\[.*?\]/g, "[^/]+");
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(currentPath);
  });

  if (shouldHideNavbar) {
    return null;
  }

  const isHomePage = ["/offers", "/explore", "/"].includes(pathname);

  const renderBranding = () => (
    <div
      className="flex items-center space-x-2 cursor-pointer"
      onClick={() => (isHomePage ? null : router.back())}
    >
      {/* {isHomePage ? ( */}
      <UtensilsCrossed className="h-6 w-6 text-orange-600" />
      {/* ) : ( */}
      {/* <ChevronLeft className="h-6 w-6 text-orange-600" /> */}
      {/* )} */}
      <span className="text-xl font-bold text-gray-900">
        {/* {isHomePage ? "Cravings" : "Back"}
         */}
        Cravings
      </span>
    </div>
  );

  const renderAuthButtons = () => {
    if (!userData) {
      return (
        <>
          <Button
            onClick={() => router.push("/login")}
            size="lg"
            variant="outline"
            className="inline-flex items-center h-fit text-nowrap text-xs gap-2 px-3 md:px-4 py-2 font-medium text-white bg-orange-600 rounded-full hover:bg-orange-700 transition-colors"
          >
            Sign In
          </Button>
          <Link href="/partner">
            <Button className="inline-flex items-center h-fit text-nowrap text-xs gap-2 px-3 md:px-4 py-2 font-medium text-white bg-orange-600 rounded-full hover:bg-orange-700 transition-colors">
              Partner with Us
            </Button>
          </Link>
        </>
      );
    }
    return null;
  };

  const renderUserProfile = () => {
    if (!userData) return null;

    const displayName =
      userData.role === "user"
        ? userData.full_name
        : userData.role === "partner"
        ? userData.store_name
        : "Super Admin";

    return (
      <Link
        href="/profile"
        className="flex text-sm items-center gap-2 text-gray-500"
      >
        <UserCircle className="h-6 w-6 text-gray-500" />
        <span className="hidden sm:inline">{displayName}</span>
      </Link>
    );
  };

  const renderNavigationLinks = () => {
    if (!userData || isMobile) return null;

    const roleBasedLinks = [
      ...(userData.role === "partner"
        ? [
            { href: "/admin", label: "Admin" },
            ...((features?.ordering.access || features?.delivery.access) &&
            userData.status === "active"
              ? [{ href: "/admin/orders", label: "Orders" }]
              : []),
            ...(features?.stockmanagement.access && userData.status === "active"
              ? [{ href: "/admin/stock-management", label: "Stock Management" }]
              : []),
          ]
        : []),
      ...(userData.role === "superadmin"
        ? [{ href: "/superadmin", label: "Super Admin" }]
        : []),
    ];

    return roleBasedLinks.map((link) => (
      <Link
        key={link.href}
        href={link.href}
        className={cn(
          "inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors",
          currentPath === link.href
            ? "text-orange-600 border-b-2 border-orange-600"
            : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
        )}
      >
        {link.label}
      </Link>
    ));
  };

  return (
    <nav className="w-full bg-white shadow-sm z-[60] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16 items-center">
          {renderBranding()}

          <div className="flex items-center gap-5">
            {renderAuthButtons()}
            <div className="flex items-center space-x-4 md:space-x-8">
              {renderNavigationLinks()}
              {userData?.role === "user" ? (
                <Link href="/my-orders">
                  <ShoppingBag className="text-gray-500" />
                </Link>
              ) : null}
              {renderUserProfile()}
              {userData && !isInstalled ? (
                <button
                  onClick={handleInstallClick}
                  className="inline-flex items-center h-fit text-nowrap text-xs gap-2 px-3 md:px-4 py-2 font-medium text-white bg-orange-600 rounded-full hover:bg-orange-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {/* <span className="">Install</span> */}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
