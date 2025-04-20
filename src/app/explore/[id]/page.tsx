import { getCommonOfferById } from "@/api/common_offers";
import InstaReelEmbeded from "@/components/InstaReelEmbeded";
import ReportReelModal from "@/components/ReportReelModal";
import { CommonOffer } from "@/components/superAdmin/OfferUploadSuperAdmin";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { InstagramLogoIcon } from "@radix-ui/react-icons";
import {
  ChevronLeft,
  Hotel,
  Map,
  MapPin,
  OctagonAlert,
  UtensilsCrossed,
} from "lucide-react";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import React from "react";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const getCommonOffer = await unstable_cache(
    async () => {
      return fetchFromHasura(getCommonOfferById, {
        id: id,
      });
    },
    ["common-offers", id],
    {
      tags: ["common-offers", id],
    }
  );

  const {
    common_offers_by_pk: commonOffer,
  }: {
    common_offers_by_pk: CommonOffer;
  } = await getCommonOffer();

  return (
    <section className=" overflow-hidden min-h-screen bg-gradient-to-b from-orange-50 to-orange-100">
      <main className="pt-5 pb-10 px-[8%] lg:py-40 grid gap-10 lg:grid-cols-2 lg:place-items-center relative">
        {/* report button  */}
        <ReportReelModal className="text-red-500 absolute top-5 right-5 flex items-end gap-2" />

        <div className="text-start grid gap-2">
          <h1 className="text-2xl font-extrabold capitalize text-orange-500 mt-5">
            {" "}
            <UtensilsCrossed size={50} /> {commonOffer.item_name}
          </h1>
          <p className="text-3xl text-orange-500 font-extrabold">
            {" "}
            <span className="text-lg font-medium">At Just</span> ₹
            {commonOffer.price}
          </p>
          <p className="text-lg font-medium flex items-end">
            {" "}
            <Hotel size={25} /> {commonOffer.partner_name}
          </p>
          <p className="text-lg flex items-end gap-1">
            <Map size={25} /> {commonOffer.district}
          </p>

          {commonOffer.location && (
            <Link
              href={commonOffer.location}
              className="text-lg  text-orange-500 flex items-end gap-1"
            >
              <MapPin size={25} />
              View Location
            </Link>
          )}
          <Link
            className="text-lg  text-orange-500 flex items-end gap-1"
            href={commonOffer?.insta_link as string}
          >
            <InstagramLogoIcon width={25} height={25} />
            View Instagram
          </Link>
        </div>

        <InstaReelEmbeded
          url={commonOffer.insta_link as string}
          image={commonOffer.image_url}
        />
      </main>
    </section>
  );
};

export default page;
