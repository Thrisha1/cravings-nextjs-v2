import { getCommonOfferById } from "@/api/common_offers";
import InstaReelEmbeded from "@/components/InstaReelEmbeded";
import { CommonOffer } from "@/components/superAdmin/OfferUploadSuperAdmin";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { unstable_cache } from "next/cache";
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
    <section className="py-5 px-10 overflow-hidden">
      <InstaReelEmbeded url={commonOffer.insta_link as string} />

      <div>
        <h1 className="text-2xl font-bold mt-4">{commonOffer.item_name}</h1>
        <p className="text-lg text-gray-600 mt-2">{commonOffer.partner_name}</p>
        <p className="text-lg text-gray-600 mt-2">
          Price: ₹{commonOffer.price}
        </p>
        {commonOffer.location && (
          <p className="text-lg text-gray-600 mt-2">
            Location: {commonOffer.location}
          </p>
        )}
        <p className="text-lg text-gray-600 mt-2">
          District: {commonOffer.district}
        </p>
      </div>
    </section>
  );
};

export default page;
