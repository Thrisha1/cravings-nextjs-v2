"use client";
import { getTempUserIdCookie } from "@/app/auth/actions";
import { fetchFromHasura } from "./hasuraClient";

export const transferTempDataToUserAccount = async (userId: string) => {
  try {
    const tempUserId = await getTempUserIdCookie();

    if (!tempUserId) {
      console.warn("No temporary user ID found. Skipping transfer.");
      return;
    }

    // get conflict followers
    const { temp_followers, existing_followers } = await fetchFromHasura(
      `
              query GetConflictingFollowers($tempUserId: String!, $userId: String!) {
                  temp_followers: followers(where: {user_id: {_eq: $tempUserId}}) {
                      partner_id
                      created_at
                  }
                  
                  existing_followers: followers(where: {user_id: {_eq: $userId}}) {
                      partner_id
                  }
              }`,
      {
        tempUserId: tempUserId,
        userId: userId,
      }
    );

    const conflictingFollowers = temp_followers
      .filter((tempFollower: any) =>
        existing_followers.some(
          (existingFollower: any) =>
            existingFollower.partner_id === tempFollower.partner_id
        )
      )
      .map((follower: any) => follower.partner_id);

    const conflictingFollowersCreatedAtMap = temp_followers
      .filter((tempFollower: any) =>
        existing_followers.some(
          (existingFollower: any) =>
            existingFollower.partner_id === tempFollower.partner_id
        )
      )
      .reduce((acc: any, follower: any) => {
        acc[follower.partner_id] = follower.created_at;
        return acc;
      }, {});

    // Prepare the updates for conflicting followers with their original created_at
    const conflictingUpdates = conflictingFollowers.map(
      (partnerId: string) => ({
        partner_id: partnerId,
        created_at: conflictingFollowersCreatedAtMap[partnerId],
      })
    );

    // Transfer followers from temp user to the main user account
    await fetchFromHasura(
      `
          mutation UpdateFollowers(
              $tempUserId: String!
              $userId: String!
              $conflictingPartnerIds: [uuid!]!
              $conflictingUpdates: [followers_updates!]!
          ) {
              # Update existing conflicts with their original created_at
              update_existing_conflicts: update_followers_many(
                  updates: $conflictingUpdates
              ) {
                  affected_rows
              }
  
              delete_temp_conflicts: delete_followers(
                  where: {
                      user_id: {_eq: $tempUserId}
                      partner_id: {_in: $conflictingPartnerIds}
                  }
              ) {
                  affected_rows
              }
  
              update_non_conflicts: update_followers(
                  where: {
                      user_id: {_eq: $tempUserId}
                      partner_id: {_nin: $conflictingPartnerIds}
                  }
                  _set: {user_id: $userId}
              ) {
                  affected_rows
                  returning {
                      id
                      partner_id
                      partner {
                          store_name
                      }
                  }
              }
          }`,
      {
        tempUserId: tempUserId,
        userId: userId,
        conflictingPartnerIds: conflictingFollowers,
        conflictingUpdates: conflictingUpdates.map(
          (update: { partner_id: string; created_at: string }) => ({
            where: {
              user_id: { _eq: userId },
              partner_id: { _eq: update.partner_id },
            },
            _set: {
              created_at: update.created_at,
            },
          })
        ),
      }
    );

    console.debug("Temporary followers transferred to user account:", {
      userId,
      tempUserId,
      conflictingFollowers,
    });

    console.log("Conflicting Followers:", conflictingFollowers);
  } catch (error) {
    console.error("Error transferring temporary data to user account:", error);
  }
};



