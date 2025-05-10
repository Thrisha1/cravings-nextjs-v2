import { HotelData, SocialLinks } from "@/app/hotels/[id]/page";

const safeParseJson = (input: any) => {
  try {
    return typeof input === "string" ? JSON.parse(input) : input || {};
  } catch (e) {
    console.error("Error parsing social links:", e);
    return {};
  }
};

export const getSocialLinks = (hoteldata: HotelData): SocialLinks => {
  const socialLinksData = safeParseJson(hoteldata?.social_links);
  const instaLink = socialLinksData?.instagram;

  return {
    instagram: instaLink || "",
    whatsapp: `https://wa.me/+91${
      hoteldata?.whatsapp_numbers ? hoteldata.whatsapp_numbers[0]?.number : hoteldata?.phone
    }`,
    googleReview: `https://search.google.com/local/writereview?placeid=${hoteldata?.place_id}`,
  };
};
