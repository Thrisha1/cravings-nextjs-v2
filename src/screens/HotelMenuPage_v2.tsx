"use client";
import React, { useEffect, useState } from "react";
import SearchBox from "@/components/SearchBox";
import Image from "next/image";
import OfferCardMin from "@/components/OfferCardMin";
import Autoplay from "embla-carousel-autoplay";

import { Heading, SearchIcon, VerifiedIcon } from "lucide-react";
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
import MenuItemsList from "@/components/hotelDetail/MenuItemsList_v2";
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
import HeadingWithAccent from "@/components/HeadingWithAccent";
import DescriptionWithTextBreak from "@/components/DescriptionWithTextBreak";

export type MenuItem = {
  description: string;
  id: string;
  image: string;
  name: string;
  price: number;
};

export type Styles ={
  backgroundColor: string;
  color: string;
  accent: string;
  border: {
    borderColor: string;
    borderWidth: string;
    borderStyle: string;
  };
}

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

  const styles : Styles = {
    backgroundColor: theme?.colors?.bg || "#F5F5F5",
    color: theme?.colors?.text || "#000",
    accent: theme?.colors?.accent || "#EA580C",
    border: {
      borderColor: theme?.colors?.text ? `${theme.colors.text}1D` : "#0000001D",
      borderWidth: "1px",
      borderStyle: "solid",
    },
  };

  return (
    <main
      style={{
        backgroundColor: styles.backgroundColor,
        color: styles.color,
      }}
      className={`overflow-x-hidden relative min-h-screen flex flex-col gap-6 pb-40 `}
    >
      {/* top part  */}
      <section className="px-[8%] pt-[20px] flex justify-between items-start">
        {/* hotel details  */}
        <div className="grid gap-3">
          {/* banner image  */}
          <div
            style={styles.border}
            className="relative h-[130px] aspect-square rounded-full overflow-hidden"
          >
            <Img
              src={hoteldata?.store_banner || "/image_placeholder.webp"}
              alt={hoteldata?.store_name}
              className="w-full h-full object-cover"
            />
          </div>

          <HeadingWithAccent
            className={"font-black text-3xl max-w-[250px]"}
            accent={styles.accent}
          >
            {hoteldata?.store_name}
          </HeadingWithAccent>

          <DescriptionWithTextBreak accent={styles.accent}>
            {hoteldata?.description}
          </DescriptionWithTextBreak>
        </div>

        {/* right top button  */}
        <div>
          {hoteldata?.id === userData?.id && (
            <ThemeChangeButton hotelData={hoteldata} theme={theme} />
          )}
        </div>
      </section>

      {/* search bar  */}
      <section className="px-[8%]">
        <button
          style={styles.border}
          className="bg-white w-full h-[55px] rounded-full flex items-center px-4 gap-3 text-black/30"
        >
          <SearchIcon />
          <span>Search</span>
        </button>
      </section>

      {/* offers  */}
      <section></section>

      {/* popular  */}
      <section>
      </section>

      {/* menu  */}
      <section>
        <MenuItemsList styles={styles} menu={hoteldata.menus} />
      </section>

    </main>
  );
};

export default HotelMenuPage;
