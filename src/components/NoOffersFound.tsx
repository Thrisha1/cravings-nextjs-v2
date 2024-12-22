import React from "react";
import { UtensilsCrossed } from "lucide-react";

const NoOffersFound = () => {
  return (
    <div className="grid place-content-center w-full min-h-[60vh]">

      <UtensilsCrossed className="text-orange-600 h-40 w-40" />
      <h1 className="text-center mt-2 font-bold text-xl text-orange-600">No Offers found!</h1>

    </div>
  );
};

export default NoOffersFound;
