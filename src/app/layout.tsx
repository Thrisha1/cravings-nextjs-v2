import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // Import Script for Google Analytics
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import Snow from "@/components/Snow";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cravings",
  description: "Find the best food deals in your area",
  icons: ["/icon-64x64_christmas.png"],
  metadataBase: new URL("http://cravings.vercel.app"),
  openGraph: {
    title: "Cravings",
    description: "Find the best food deals in your area",
    type: "website",
    images: ["/ogImage_christmas.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Snow />
        <Navbar />
        <PwaInstallPrompt />
        {children}
      </body>
    </html>
  );
}
