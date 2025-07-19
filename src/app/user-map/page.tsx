import UsersMap from "@/components/UsersMap";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { unstable_cache } from "next/cache";
import React from "react";


const page = async () => {
  const getPartners = unstable_cache(
    async () => {
      try {
        return fetchFromHasura(`query MyQuery {
            partners(where: {geo_location: {_is_null: false} , status: {_eq: "active"}}) {
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

  const getUsers = unstable_cache(
    async () => {
      try {
        return fetchFromHasura(`query MyQuery {
            users(where: {location: {_is_null: false}}) {
                location
                phone
                id
            }
            }
            `);
      } catch (error) {
        throw error;
      }
    },
    ["users-location"],
    {
      tags: ["users-location"],
    }
  );

  const { partners } = await getPartners();
  const { users } = await getUsers();

  return (
    <UsersMap partners={partners} users={users} />
  );
};

export default page;
