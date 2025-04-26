"use client";
import React, { useEffect, useState } from "react";
import SearchBox from "@/components/SearchBox";
import Image from "next/image";
import OfferCardMin from "@/components/OfferCardMin";
import Autoplay from "embla-carousel-autoplay";

import {
  VerifiedIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { revalidateTag } from "@/app/actions/revalidate";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Error from "@/app/hotels/error";
import ShowAllBtn from "@/components/hotelDetail/ShowAllBtn";
import RateThis from "@/components/RateThis";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MenuItemsList from "@/components/hotelDetail/MenuItemsList";
import { Offer } from "@/store/offerStore_hasura";
import { useAuthStore } from "@/store/authStore";
import { HotelData } from "@/app/hotels/[id]/page";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import ThemeChangeButton, {
  ThemeConfig,
} from "@/components/hotelDetail/ThemeChangeButton";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { updatePartnerThemeMutation } from "@/api/partners";
import Img from "@/components/Img";

export type MenuItem = {
  description: string;
  id: string;
  image: string;
  name: string;
  price: number;
};

interface HotelMenuPageProps {
  offers: Offer[];
  hoteldata: HotelData;
  auth: {
    id: string;
    role: string;
  } | null;
  theme: ThemeConfig | null;
}

const HotelMenuPage = ({
  offers,
  hoteldata,
  auth,
  theme,
}: HotelMenuPageProps) => {
  const { userData } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  //For reasurance
  offers = offers.filter(
    (offer) =>
      new Date(offer.end_time).setHours(0, 0, 0, 0) <
      new Date().setHours(0, 0, 0, 0)
  );

  const styles = {
    backgroundColor: theme?.colors?.bg || "#F5F5F5",
    color: theme?.colors?.text || "#000",
    accent: theme?.colors?.accent || "#EA580C",
    border : {
      color: theme?.colors?.text || "#000",
      width: "1px",
      style: "solid",
      opacity: "0.5",
    }
  };


  return (
    <main
      style={{
        backgroundColor: styles.backgroundColor,
        color: styles.color,
      }}
      className={`overflow-x-hidden relative min-h-screen`}
    >


      {/* top part  */}
      <div>

        {/* hotel details  */}
        <div className="px-[8%] pt-[20px]">

          <div style={{
            borderColor: styles.border.color,
            borderWidth: styles.border.width,
            borderStyle: styles.border.style,
          }} className="relative h-[140px] aspect-square rounded-full overflow-hidden">
            <Img
              src={hoteldata?.store_banner || "/image_placeholder.webp"}
              alt={hoteldata?.store_name}
              className="w-full h-full object-cover"
            />
          </div>

        </div>

        {/* right top button  */}
        <div>

        </div>

      </div>

     
    </main>
  );
};

export default HotelMenuPage;
