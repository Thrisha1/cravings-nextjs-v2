"use server";

import { revalidateTag } from "next/cache";

const revalidateOffer = async () => {
  revalidateTag("offers");
  console.log("Offers revalidated");
};

export { revalidateOffer };
