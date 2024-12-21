import Offers from "@/screens/Offers";
import React, { Suspense } from "react";

const page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Offers />
    </Suspense>
  );
};

export default page;
