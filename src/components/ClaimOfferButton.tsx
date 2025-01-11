import React from "react";
import { Button } from "./ui/button";
import { Offer } from "@/store/offerStore";
import { CountdownTimer } from "./CountdownTimer";
import { Ticket } from "lucide-react";

type ClaimOfferButtonProps = {
  offer: Offer;
  isClaimed: boolean;
  offersClaimable: number;
  setShowTicket: (show: boolean) => void;
  handleClaimOffer: () => void;
};

const buttonConfig = {
  upcoming: {
    text: (offer: Offer) => (
      <>
        Offer Activates in:{" "}
        <CountdownTimer endTime={offer.fromTime} upcomming={true} />
      </>
    ),
    className: "bg-gray-100 text-[#E63946] shadow-xl border border-gray-200",
    disabled: true,
  },
  claimed: {
    text: "View Ticket",
    className: "bg-green-600 hover:bg-green-700",
    disabled: false,
  },
  available: {
    text: "Claim Offer",
    className: "bg-orange-600 hover:bg-orange-700",
    disabled: false,
  },
  offerNotClaimable: {
    text: "No Offer Coupon Left",
    className: "bg-red-400 cursor-not-allowed disabled:opacity-[70%]",
    disabled: true,
  },
};

const getButtonState = (
  offer: Offer,
  isClaimed: boolean,
  offersClaimable: number
) => {
  if (new Date(offer.fromTime) > new Date()) {
    return "upcoming";
  }
  if (isClaimed) {
    return "claimed";
  }
  if (offersClaimable > 0) {
    return "available";
  }
  return "offerNotClaimable";
};

const ClaimOfferButton: React.FC<ClaimOfferButtonProps> = ({
  offer,
  isClaimed,
  offersClaimable,
  setShowTicket,
  handleClaimOffer,
}) => {
  const buttonState = getButtonState(offer, isClaimed, offersClaimable);
  const { text, className, disabled } = buttonConfig[buttonState];

  return (
    <Button
      disabled={disabled}
      onClick={isClaimed ? () => setShowTicket(true) : offersClaimable > 0 ? handleClaimOffer : undefined}
      className={`w-full py-3 text-lg font-semibold transition-all ${className}`}
    >
      {!isClaimed && (
        <>
          <span>{offersClaimable}</span>
          <Ticket className="w-4 h-4 mr-2 ml-1" />
        </>
      )}
      {typeof text === "function" ? text(offer) : text}
    </Button>
  );
};

export default ClaimOfferButton;
