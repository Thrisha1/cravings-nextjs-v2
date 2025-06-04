import { useAuthStore } from "@/store/authStore";
import { fetchFromHasura } from "./hasuraClient";

export async function addToRecent(partnerId: string) {
  try {
    const userData = useAuthStore.getState().userData;

    if (!userData || !userData.id) {
      console.error("User not logged in or user ID is missing.");
      return;
    }


    await fetchFromHasura(
      `
        mutation InsertRecent($userId: uuid!, $partnerId: uuid!) {
            insert_followers_one(
                object: { user_id: $userId, partner_id: $partnerId, created_at: "now()" },
                on_conflict: { constraint: followers_user_id_partner_id_key, update_columns: [] }
            ) {
                id
            }
        }`,
      {
        userId: userData.id,
        partnerId: partnerId,
      }
    );
  } catch {
    console.error("Error adding to recent");
  }
}
