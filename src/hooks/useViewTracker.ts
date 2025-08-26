import { useEffect } from "react";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { revalidateTag } from "@/app/actions/revalidate";

const INCREMENT_VIEW_MUTATION = `
  mutation IncrementOfferView($offerId: uuid!) {
    update_common_offers_by_pk(
      pk_columns: { id: $offerId },
      _inc: { view_count: 1 }
    ) {
      id
      view_count
    }
  }
`;

export const useViewTracker = (offerId: string) => {
  useEffect(() => {
    if (!offerId) {
      return;
    }

    const storageKey = `viewed_offer_${offerId}`;
    const hasViewed = localStorage.getItem(storageKey);

    const trackView = async () => {
      try {
        if (!hasViewed) {
          localStorage.setItem(storageKey, "true");
          await fetchFromHasura(INCREMENT_VIEW_MUTATION, { offerId });
          await revalidateTag(offerId);
        }
      } catch (error) {
        console.error("Failed to track view:", error);
      }
    };

    trackView();
  }, [offerId]);
};
