import Admin from "@/screens/Admin";
import React from "react";
import { getAuthCookie } from "../auth/actions";
import { unstable_cache } from "next/cache";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { getPartnerAndOffersQuery } from "@/api/partners";

import { Partner } from "@/store/authStore";

const page = async () => {
  const userId = (await getAuthCookie())?.id;

  const getParnterData = unstable_cache(
    async () => {
      try {
        return fetchFromHasura(getPartnerAndOffersQuery, {
          id: userId,
        });
      } catch (error) {
        console.error("Error fetching partner data:", error);
        return null;
      }
    },
    [userId as string, "partner-data"],
    { tags: [userId as string, "partner-data"] }
  );

  const userDataResponse = await getParnterData();
  const userData = userDataResponse?.partners[0];

  if (userData?.status !== "active") {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-orange-50 to-orange-100 flex justify-center items-center">
        <div className="max-w-2xl w-full p-6 bg-white border-4 border-orange-500 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-orange-600 mb-4">
            Hotel Verification In Progress
          </h2>
          <p className="text-gray-900 mb-4">
            You are currently in the verification process. We will verify your
            hotel within 24 hours. For immediate verification, please call{" "}
            <span className="font-bold text-orange-600">+91 6238969297</span>.
          </p>
        </div>
      </div>
    );
  } else {
    return <Admin userData={userData as Partner} />;
  }
};

export default page;
