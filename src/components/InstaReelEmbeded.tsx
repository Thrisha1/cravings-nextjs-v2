"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";

const InstagramEmbed = dynamic(
  () => import("react-social-media-embed").then((mod) => mod.InstagramEmbed),
  { ssr: false }
);

const InstaReelEmbed = ({ url, image }: { url: string; image: string }) => {

  return (
    <div className="flex justify-start">
      <div className="w-[228px] h-[380px]  overflow-clip origin-center rounded-xl relative shadow-xl">
        <div className="absolute bottom-0 left-0 z-[15] text-white font-bold flex-col flex justify-end bg-gradient-to-t from-black to-transparent p-5 h-[20%] w-full ">
          ▶ View Reel
          <p className="text-sm text-white/70 font-medium">Click to view reel</p>
        </div>

        <InstagramEmbed
          placeholderDisabled
          url={url}
          width={328}
          className="-translate-y-20 -translate-x-[49px]  z-[10]"
        />
        <Image
          src={image}
          alt="Instagram Reel"
          width={1}
          height={1}
          className="w-full h-full object-cover rounded-xl blur-xl absolute top-0 left-0"
        />
      </div>
    </div>
  );
};

export default InstaReelEmbed;