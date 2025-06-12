import { getAllPartnersQuery, getNearByPartnersQuery } from "@/api/partners";
import { fetchFromHasura } from "@/lib/hasuraClient";
import HotelsPage from "@/screens/HotelsPage";
import { getAuthCookie, getLocationCookie } from "../auth/actions";
import { getFollowersQuery } from "@/api/followers";

export default async function page({
  searchParams,
}: {
  searchParams: Promise<{ location?: string | null; query?: string }>;
}) {
  const cookies = await getAuthCookie();
  const location = (await searchParams)?.location?.toLowerCase() || null;
  const query = (await searchParams)?.query?.toLowerCase() || null;
  const userLocation = await getLocationCookie();
  const limit = 10;

  const { get_all_partners, get_all_partners_aggregate } = await fetchFromHasura(
    getNearByPartnersQuery,
    {
      user_lat: userLocation?.lat || 0,
      user_lng: userLocation?.lng || 0,
      limit_count: limit,
      offset_count: 0,
      district_filter: location ? `%${location}%` : "%",
      search_query: query ? `%${query}%` : ""
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
        partners: get_all_partners,
        totalCount: get_all_partners_aggregate?.aggregate?.count || 0,
      }}
      district={location || "all"}
      hasUserLocation={!!userLocation}
      limit={limit}
      query={query || ""}
    />
  );
}
