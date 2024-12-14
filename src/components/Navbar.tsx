import {
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";
import { UtensilsCrossed, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { PartnerDialog } from "./PartnerDialog";
// import { generateToken, messaging } from "../lib/firebase.ts";
// import { onMessage } from "firebase/messaging";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import { isSupported } from "firebase/messaging";

export function Navbar() {
  const router = useNavigate();
  const location = useLocation();
  const { user, userData, signOut } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  // const [notificationPermission, setNotificationPermission] = useState(
  //   Notification.permission
  // );

  const links = [
    { href: "/offers", label: "Offers" },
    ...(userData?.role === "hotel" ? [{ href: "/admin", label: "Admin" }] : []),
    ...(userData?.role === "superadmin"
      ? [{ href: "/superadmin", label: "Super Admin" }]
      : []),
  ];

  // useEffect(() => {
  //   (async () => {
  //   const hasFirebaseMessagingSupport = await isSupported();
  //   if (hasFirebaseMessagingSupport) {
  //     generateToken();
  //   }
  // })();

  //   onMessage(messaging, (payload) => {
  //     console.log("Message received. ", payload);
  //     if (navigator.serviceWorker) {
  //       navigator.serviceWorker.getRegistration().then((registration) => {
  //         if (registration && payload.notification) {
  //           registration.showNotification(
  //             payload.notification.title || "No Title",
  //             {
  //               body: payload.notification.body,
  //               icon: payload.notification.icon,
  //             }
  //           );
  //         }
  //       });
  //     }
  //   });
  // }, [notificationPermission]);

  // const requestNotificationPermission = async () => {
  //   const permission = await Notification.requestPermission();
  //   setNotificationPermission(permission);
  // };

  const NavLinks = () => (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          to={link.href}
          onClick={() => setIsOpen(false)}
          className={cn(
            "inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors",
            location.pathname === link.href
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
    <nav className="w-full bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/offers" className="flex items-center space-x-2">
              <UtensilsCrossed className="h-6 w-6 text-orange-600" />
              <span className="text-xl font-bold text-gray-900">Cravings</span>
            </Link>
          </div>

          <div className="flex items-center gap-5">
{/*             {notificationPermission !== "granted" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={requestNotificationPermission}
                      className="text-red-500 hover:text-gray-700 relative group"
                    >
                      <Bell className="h-5 w-5 animate-bounce group-hover:animate-none transition-all" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-gray-400">Enable notification</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )} */}

            {!user && (
              <Button
                onClick={() => router("/login")}
                size="lg"
                variant="outline"
                className="text-white font-medium bg-orange-600 hover:bg-orange-50 hover:border-orange-600 hover:text-orange-600 px-5 text-[1rem] py-3 rounded-full transition-all duration-300 "
              >
                Sign In
              </Button>
            )}

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <NavLinks />
            </div>

            {/* Mobile Navigation */}
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
  );
}
