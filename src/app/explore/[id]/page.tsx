import { getCommonOfferById } from "@/api/common_offers";
import { getAuthCookie } from "@/app/auth/actions";
import DeleteExploreOfferBtn from "@/components/explore/DeleteExploreOfferBtn";
// import GeoAddress from "@/components/explore/geoAddress";
import ImageList from "@/components/explore/ImageList";
import ResendOfferMsgBtn from "@/components/explore/ResendOfferMsgBtn";
import ScrollDownIndicator from "@/components/explore/ScrollDownIndicator";
import ShareExploreItemBtn from "@/components/explore/ShareExploreItemBtn";
import SideActionButtons from "@/components/explore/SideActionButtons";
import VideoStats from "@/components/explore/VideoStats";
import InstaReelEmbed from "@/components/InstaReelEmbeded";
import ReportReelModal from "@/components/ReportReelModal";
import { CommonOffer } from "@/components/superAdmin/OfferUploadSuperAdmin";
import { decryptText } from "@/lib/encrtption";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { InstagramLogoIcon } from "@radix-ui/react-icons";
import {
  Hotel,
  Map,
  MapPin,
  UtensilsCrossed,
  Star,
  Clock,
  Heart,
  Share2,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
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
  const cookies = await getAuthCookie();

  const getOffer = unstable_cache(
    async (id: string) => {
      if (!id) {
        throw new Error("offer ID not found");
      }

      const offers = await fetchFromHasura(getCommonOfferById, {
        id: id,
        user_id: cookies?.id || "",
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
    description: `*KIDILAN FOOD SPOT ALERT* 🚨\n\n🎉 *${
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
      description: `*KIDILAN FOOD SPOT ALERT* 🚨\n\n🎉 *${
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
  const authToken = (await cookies()).get("new_auth_token")?.value;
  let geoData: any = null;

  let decrypted = authToken
    ? (decryptText(authToken) as { id: string; role: string })
    : null;

  const role = decrypted?.role || "user";

  const getCommonOffer = await unstable_cache(
    async () => {
      return fetchFromHasura(getCommonOfferById, {
        id: id,
        user_id: decrypted?.id || "",
      });
    },
    ["common-offers", id],
    {
      tags: ["common-offers", id],
    }
  );

  const {
    common_offers_by_pk : commonOffer,
  }: {
    common_offers_by_pk: CommonOffer;
  } = await getCommonOffer();



  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Main Layout - Reel Focused */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
          {/* Reel Video Section */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-8">
              <div className="relative">
                {/* Reel Container - Shorter Height */}
                <div className="relative w-full max-w-xs mx-auto h-[500px] bg-black rounded-3xl overflow-hidden shadow-xl">
                  <InstaReelEmbed
                    image={commonOffer.image_url}
                    url={commonOffer.insta_link as string}
                  />

                  <ScrollDownIndicator />

                  {/* Reel UI Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Side action buttons */}
                    <SideActionButtons
                      commonOffer={commonOffer}
                      user={decrypted}
                    />
                  </div>
                </div>

                {/* Video Stats */}
                <VideoStats commonOffer={commonOffer} />
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                <Star className="w-4 h-4 fill-current" />
                Featured Offer
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-orange-600">
                  <UtensilsCrossed className="w-6 h-6" />
                  <span className="text-sm font-medium uppercase tracking-wide">
                    Delicious Deal
                  </span>
                </div>
                <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 capitalize leading-tight">
                  {commonOffer.item_name.toLowerCase()}
                </h1>
              </div>
            </div>

            {/* Price and Restaurant Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price Card */}
              {commonOffer?.price > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center gap-5">
                      <span className="text-gray-600 text-lg font-medium">
                        Starting at
                      </span>
                      <span className="text-3xl font-black text-orange-600">
                        ₹{commonOffer.price}
                      </span>
                      {/* <span className="text-gray-500 line-through text-lg">
                        ₹{Math.round(commonOffer.price * 1.3)}
                      </span> */}
                    </div>
                    {/* <div className="flex items-center gap-2 text-green-600 font-medium">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Limited time offer</span>
                    </div> */}
                  </div>
                </div>
              )}

              {/* Restaurant Info */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm">
                    <Hotel className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 capitalize text-lg">
                      {commonOffer.partner_name.toLowerCase()}
                    </h3>
                  </div>
                </div>

                {commonOffer?.district && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Map className="w-5 h-5 text-orange-500" />
                    <span className="capitalize font-medium">
                      {commonOffer.district.toLowerCase()}
                    </span>
                  </div>
                )}

                {/* {(commonOffer?.coordinates?.coordinates.length ?? 0) > 0 && (
                  <GeoAddress commonOffer={commonOffer} />
                )} */}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {commonOffer.location && (
                <Link
                  href={commonOffer.location}
                  className="bg-orange-500 text-sm text-nowrap hover:bg-orange-600 text-white px-6 py-4 rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-sm"
                >
                  <MapPin className="w-5 h-5" />
                  Get Directions
                </Link>
              )}

              {commonOffer.insta_link && (
                <Link
                  href={commonOffer?.insta_link as string}
                  className="bg-white border-2 border-gray-300 text-sm hover:border-orange-300 hover:bg-orange-50 text-gray-700 px-6 py-4 rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-sm"
                >
                  <InstagramLogoIcon width={20} height={20} />
                  Instagram
                </Link>
              )}

              {/* <div className="flex items-center">
                <ShareExploreItemBtn offer={commonOffer} />
              </div> */}

              {/* <button className="bg-white border-2 border-gray-300 hover:border-red-300 hover:bg-red-50 text-gray-700 px-6 py-4 rounded-xl transition-colors shadow-sm">
                <Heart className="w-5 h-5" />
              </button> */}
            </div>

            {/* Description */}
            {commonOffer?.description && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-4 text-xl">
                  About This Offer
                </h4>
                <p className="text-gray-700 leading-relaxed text-sm">
                  {commonOffer.description}
                </p>
              </div>
            )}

            {/* Additional Info */}
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                <h5 className="font-semibold text-orange-800 mb-2">
                  Why Choose This Deal?
                </h5>
                <ul className="text-orange-700 text-sm space-y-1">
                  <li>• Fresh ingredients daily</li>
                  <li>• Expert chef preparation</li>
                  <li>• Quick service guarantee</li>
                  <li>• Hygiene standards maintained</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <h5 className="font-semibold text-amber-800 mb-2">
                  Restaurant Info
                </h5>
                <div className="text-amber-700 text-sm space-y-1">
                  <div>⏰ Open: 10 AM - 10 PM</div>
                  <div>📞 Call for reservations</div>
                  <div>🚗 Parking available</div>
                  <div>💳 Card payments accepted</div>
                </div>
              </div>
            </div> */}

            {/* Admin Actions */}
            {role === "superadmin" && (
              <div className="bg-gray-100 border border-gray-300 rounded-2xl p-6">
                <h4 className="font-semibold text-gray-800 mb-4">
                  Admin Actions
                </h4>
                <div className="flex flex-wrap gap-3">
                  {/* <DeleteExploreOfferBtn offerId={commonOffer.id} />
                  <ResendOfferMsgBtn offer={commonOffer} /> */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-orange-500 py-12 mt-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl font-bold text-white mb-4">
            Craving for More? Explore Now!
          </h3>
          <p className="text-orange-100 mb-8 text-sm">
            Don't miss out on this amazing deal from Cravings!
          </p>
          {/* <button className="bg-white text-orange-600 px-12 py-4 rounded-xl font-bold text-xl hover:bg-orange-50 transition-colors shadow-lg">
            Order Now
          </button> */}
          {/* <p className="text-orange-200 text-sm mt-4">
            Login to get exclusive offers and deals!
          </p> */}
        </div>
      </div>
    </div>
  );
};

export default page;
