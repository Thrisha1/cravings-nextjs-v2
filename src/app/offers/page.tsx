import OfferLoadinPage from "@/components/OfferLoadinPage";
import Offers from "@/screens/Offers";
import React, { Suspense } from "react";

const page = () => {
  return (
    <Suspense fallback={<OfferLoadinPage />}>
      <Offers />
    </Suspense>
  );
};

export default page;
