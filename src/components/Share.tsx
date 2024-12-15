import { Badge } from "@/components/ui/badge";

interface ShareProps {
  offerId: string | string[];
  className?: string;
}
const Share = ({ offerId , className }: ShareProps) => {
  const handleShare = () => {
    const offerLink = `${window.location.origin}/offer/${offerId}`;
    navigator.clipboard.writeText(offerLink);
    alert("Link copied to clipboard!");

    // Optional: Open WhatsApp share link
    const whatsappMessage = `Check out this offer: ${offerLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      whatsappMessage
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Badge onClick={handleShare} className={`bg-orange-500 text-white cursor-pointer ${className}`}>
      <div className="flex flex-row-reverse gap-2">
        <h1>Share</h1>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-4 h-4 cursor-pointer text-white"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
          />
        </svg>
      </div>
    </Badge>
  );
};

export default Share;
