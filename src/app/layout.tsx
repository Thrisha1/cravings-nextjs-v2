import type { Metadata } from "next";
import Script from "next/script"; // Import Script for Google Analytics
import "./globals.css";
// import { Navbar } from "@/components/Navbar";
// import Snow from "@/components/Snow";
// import PwaInstallPrompt from "@/components/PwaInstallPrompt";
// import RateUsModal from "@/components/RateUsModal";
import "@smastrom/react-rating/style.css";
import { Toaster } from "@/components/ui/sonner";
import AuthInitializer from "@/providers/AuthInitializer";
import BottomNav from "@/components/BottomNav";
import { Navbar } from "@/components/Navbar";
import { getAuthCookie } from "./auth/actions";
import WhatsappGroupJoinAlertDialog from "@/components/WhatsappGroupJoinAlertDialog";
// import CravingsCashInfoModal from "@/components/CravingsCashInfoModal";
// import SyncUserOfferCoupons from "@/components/SyncUserOfferCoupons";
// import LocationAccess from "@/components/LocationAccess";
// import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Cravings",
  description: "Find the best food deals in your area",
  icons: ["/icon-64x64.png", "/icon-192x192.png", "/icon-512x512.png"],
  metadataBase: new URL("https://cravings.live"),
  openGraph: {
    title: "Cravings",
    description: "Find the best food deals in your area",
    type: "website",
    images: ["/ogImage_default.jpeg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthCookie();
  return (
    <html lang="en">
      <head>
        {/* Google Analytics Script */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-7SV68LS8J6');
            `,
          }}
        />
      </head>
      <body className={`antialiased`}>
        <AuthInitializer />
        {(user?.role === "user" || !user) && <WhatsappGroupJoinAlertDialog />}
        <Toaster richColors closeButton />
        {/* <Snow /> */}
        <Navbar userData={user} />
        {/* <RateUsModal /> */}

        {/* pwa install is currently turned off */}
        {/* <PwaInstallPrompt /> */}

        {children}
        <BottomNav userData={user} />
      </body>
    </html>
  );
}
