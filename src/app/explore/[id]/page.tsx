import { getCommonOfferById } from "@/api/common_offers";
import DeleteExploreOfferBtn from "@/components/explore/DeleteExploreOfferBtn";
import ResendOfferMsgBtn from "@/components/explore/ResendOfferMsgBtn";
import ShareExploreItemBtn from "@/components/explore/ShareExploreItemBtn";
import InstaReelEmbeded from "@/components/InstaReelEmbeded";
import ReportReelModal from "@/components/ReportReelModal";
import { CommonOffer } from "@/components/superAdmin/OfferUploadSuperAdmin";
import { decryptText } from "@/lib/encrtption";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { InstagramLogoIcon } from "@radix-ui/react-icons";
import { Hotel, Map, MapPin, UtensilsCrossed } from "lucide-react";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import Link from "next/link";
import React from "react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const getOffer = unstable_cache(
    async (id: string) => {
      if (!id) {
        throw new Error("offer ID not found");
      }

      const offers = await fetchFromHasura(getCommonOfferById, {
        id: id,
      });

      if (offers.common_offers_by_pk === null) {
        throw new Error("Deal not found");
      }

      return offers.common_offers_by_pk as CommonOffer;
    },
    [id],
    { tags: [id] }
  );

  const commonOffer = await getOffer(id);

  if (!commonOffer) {
    throw new Error("Offer not found");
  }

  return {
    title: commonOffer.item_name,
    icons: [commonOffer.image_url],
    description: `*KIDILAN FOOD SPOT ALERT* �\n\n🎉 *${
      commonOffer.partner_name
    }* is offering *${commonOffer.item_name}* at *₹${
      commonOffer.price
    }*! 🌟\n\n${
      commonOffer.insta_link ? `📱 Instagram: ${commonOffer.insta_link}\n` : ""
    }🔗 View offer: www.cravings.live/explore/${
      commonOffer.id
    }\n\nDon't miss out on this amazing offer from *Cravings*! 🍽️✨`,
    openGraph: {
      images: [commonOffer.image_url],
      title: commonOffer.item_name,
      description: `*KIDILAN FOOD SPOT ALERT* �\n\n🎉 *${
        commonOffer.partner_name
      }* is offering *${commonOffer.item_name}* at *₹${
        commonOffer.price
      }*! 🌟\n\n${
        commonOffer.insta_link
          ? `📱 Instagram: ${commonOffer.insta_link}\n`
          : ""
      }🔗 View offer: www.cravings.live/explore/${
        commonOffer.id
      }\n\nDon't miss out on this amazing offer from *Cravings*! 🍽️✨`,
    },
  };
}

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const authToken = (await cookies()).get("auth_token")?.value;

  let decrypted = authToken
    ? (decryptText(authToken) as { id: string; role: string })
    : null;

  const role = decrypted?.role || "user";

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
        <div className="absolute top-5 right-5 grid gap-5">
          {role === "superadmin" ? (
            <>
              <DeleteExploreOfferBtn
                id={commonOffer.id}
                image_url={commonOffer.image_url}
              />
              <ResendOfferMsgBtn id={commonOffer.id} />
            </>
          ) : (
            <ReportReelModal />
          )}
        </div>

        <div className="text-start grid gap-2">
          <h1 className="text-2xl font-extrabold text-orange-500 mt-5 capitalize">
            {" "}
            <UtensilsCrossed size={50} /> {commonOffer.item_name.toLowerCase()}
          </h1>
          {commonOffer?.price > 0 ? (
            <p className="text-3xl text-orange-500 font-extrabold">
              {" "}
              <span className="text-lg font-medium">At Just</span> ₹
              {commonOffer.price}
            </p>
          ) : (
            <p className="text-3xl font-bold text-orange-600"></p>
          )}
          <p className=" mt-3 font-medium gap-1 flex items-start capitalize ">
            {" "}
            <Hotel size={25} />{" "}
            <span className="flex-1">
              {commonOffer.partner_name.toLowerCase()}
            </span>
          </p>
          {commonOffer?.district && (
            <p className=" flex items-end gap-1 capitalize">
              <Map size={25} /> {commonOffer.district.toLowerCase()}
            </p>
          )}

          {commonOffer.location && (
            <Link
              href={commonOffer.location}
              className="  text-orange-500 flex items-end gap-1"
            >
              <MapPin size={25} />
              View Location
            </Link>
          )}
          {commonOffer.insta_link && (
            <Link
              className="  text-orange-500 flex items-end gap-1"
              href={commonOffer?.insta_link as string}
            >
              <InstagramLogoIcon width={25} height={25} />
              View On Instagram
            </Link>
          )}

          {/* share button  */}
          <ShareExploreItemBtn offer={commonOffer} />

          {commonOffer?.description && (
            <p className=" gap-1 text-black/80 mt-3">
              <span className="text-lg font-medium">More Details:</span>{" "}
              {commonOffer.description}
            </p>
          )}
        </div>

        {/* {commonOffer.insta_link && (
          <InstaReelEmbeded
            url={commonOffer.insta_link as string}
            image={commonOffer.image_url}
          />
        )} */}
      </main>
    </section>
  );
};

export default page;
