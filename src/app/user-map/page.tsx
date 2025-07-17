import UsersMap from "@/components/UsersMap";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { unstable_cache } from "next/cache";
import React from "react";


const page = async () => {
  const getPartners = unstable_cache(
    async () => {
      try {
        return fetchFromHasura(`query MyQuery {
            partners(where: {geo_location: {_is_null: false}}) {
                geo_location
                store_name
                store_banner
                status
                country
                district
                id
            }
            }
            `);
      } catch (error) {
        throw error;
      }
    },
    ["partners-geo-loc"],
    {
      tags: ["partners-geo-loc"],
    }
  );

  const { partners } = await getPartners();

  return (
    <UsersMap partners={partners} />
  );
};

export default page;
