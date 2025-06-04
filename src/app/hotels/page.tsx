import { getAllPartnersQuery } from "@/api/partners";
import { fetchFromHasura } from "@/lib/hasuraClient";
import HotelsPage from "@/screens/HotelsPage";
import { getAuthCookie } from "../auth/actions";
import { getFollowersQuery } from "@/api/followers";

export default async function page({
  searchParams,
}: {
  searchParams: Promise<{ location?: string | null; query?: string }>;
}) {
  const cookies = await getAuthCookie();
  const location = (await searchParams)?.location?.toLowerCase() || null;

  const { partners, partners_aggregate } = await fetchFromHasura(
    getAllPartnersQuery,
    {
      limit: 8,
      offset: 0,
      district: location ? `%${location}%` : "%",
    }
  );

  let followers = [];
  let followers_aggregate = { aggregate: { count: 0 } };

  if (cookies) {
    const data = await fetchFromHasura(getFollowersQuery, {
      userId: cookies?.id || null,
      limit: 5,
      offset: 0,
    });

    followers = data?.followers?.map((follower: any) => follower.partner) || [];
    followers_aggregate = data?.followers_aggregate || {
      aggregate: { count: 0 },
    };
  }

  return (
    <HotelsPage
      recentVisitsData={{
        recentVisits: followers,
        totalCount: followers_aggregate?.aggregate?.count || 0,
      }}
      partnersData={{
        partners,
        totalCount: partners_aggregate?.aggregate?.count || 0,
      }}
      district={location || "all"}
    />
  );
}
