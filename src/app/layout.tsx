import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

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
  icons: ["/icon-192x192.png", "/icon-512x512.png", "/icon-64x64.png"],
  metadataBase: new URL("http://cravings.vercel.app"),
  openGraph: {
    title: "Cravings",
    description: "Find the best food deals in your area",
    type: "website",
    images: ["/ogImage.jpeg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
