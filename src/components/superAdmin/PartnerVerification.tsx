import { fetchFromHasura } from "@/lib/hasuraClient";
import { getInactivePartnersQuery, Partner } from "@/api/partners";
import PartnerList from "../partnerVerification/PartnerList";

export default async function PartnerVerificationPage() {
  const response = await fetchFromHasura(getInactivePartnersQuery);
  const partners = (response as { partners: Partner[] }).partners;
  // const partners = response.users as Partner[];

  return <PartnerList initialPartners={partners} />;
}
