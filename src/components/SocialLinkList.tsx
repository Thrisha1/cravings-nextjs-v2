import { SocialLinks } from "@/app/hotels/[...id]/page";
import { ChatBubbleIcon, InstagramLogoIcon } from "@radix-ui/react-icons";
import { FaGoogle, FaInstagram, FaWhatsapp } from "react-icons/fa";
import React from "react";
import { Styles } from "@/screens/HotelMenuPage_v2";

const SocialLinkList = ({ socialLinks , styles }: { socialLinks: SocialLinks , styles : Styles }) => {
  return (
    <>
      {socialLinks && (
        <>
          {socialLinks.instagram && (
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className=" hover:text-gray-700"
              style={{
                color: styles?.accent || "#000000",
              }}
            >
              <FaInstagram className="w-6 h-6" />
            </a>
          )}
          {socialLinks.whatsapp && (
            <a
              href={socialLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className=" hover:text-gray-700"
              style={{
                color: styles?.accent || "#000000",
              }}
            >
              <FaWhatsapp className="w-6 h-6" />
            </a>
          )}
          {socialLinks.googleReview && (
            <a
              href={socialLinks.googleReview}
              target="_blank"
              rel="noopener noreferrer"
              className=" hover:text-gray-700"
              style={{
                color: styles?.accent || "#000000",
              }}
            >
              <FaGoogle className="w-6 h-6" />
            </a>
          )}
        </>
      )}
    </>
  );
};

export default SocialLinkList;
