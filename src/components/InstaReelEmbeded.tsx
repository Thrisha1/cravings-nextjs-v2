"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";

const InstagramEmbed = dynamic(
  () => import("react-social-media-embed").then((mod) => mod.InstagramEmbed),
  { ssr: false }
);

const InstaReelEmbed = ({ url }: { url: string }) => {


    useEffect(() => {
        //play the real automatically
        const iframe = document.querySelector("iframe");
        if (iframe) {
            const src = iframe.getAttribute("src");
            if (src) {
                const newSrc = src.replace("shortcode", "embed");
                iframe.setAttribute("src", newSrc);
                iframe.setAttribute("allow", "autoplay");
                iframe.setAttribute("allowFullScreen", "true");
                iframe.setAttribute("allowtransparency", "true");
                iframe.setAttribute("scrolling", "no");
                iframe.setAttribute("frameBorder", "0");
                iframe.setAttribute("height", "100%");
                iframe.setAttribute("width", "100%");
                iframe.setAttribute("style", "border:none;overflow:hidden");
                iframe.setAttribute("loading", "lazy");
                iframe.setAttribute("sandbox", "allow-same-origin allow-scripts");  
            }
        }
    },[]);

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div className="w-[328px] h-[380px]  overflow-hidden">
        <InstagramEmbed  url={url} width={328} className="-translate-y-20" />
      </div>
    </div>
  );
};

export default InstaReelEmbed;
