import React from "react";
import { getAuthCookie } from "../auth/actions"; // Assumed path
import { fetchFromHasura } from "@/lib/hasuraClient"; // Assumed path
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SubscriptionDetails from "@/components/SubscriptionDetails";


export type Subscription = {
  id: string;
  created_at: string;
  expiry_date: string;
  plan: string;
  type: string;
  partner: {
    id: string;
    store_name: string;
    email: string;
    phone: string;
  };
};



const Page = async () => {
  const cookies = await getAuthCookie();

  if (!cookies?.id || cookies?.role !== "partner") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-500">Unauthorized Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You must be logged in as a partner to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { partner_subscriptions } = await fetchFromHasura(
    `
    query GetPartnerSubscription($partnerId: uuid!) {
      partner_subscriptions(where: { partner_id: { _eq: $partnerId } } , limit: 1 , order_by: { created_at: desc }) {
        id
        created_at
        expiry_date
        plan
        type
        partner {
            id
            store_name
            email
            phone
        }
      }
    }
    `,
    {
      partnerId: cookies.id,
    }
  );

  const latestSubscription = partner_subscriptions?.[0] || null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="w-full max-w-md">
        <SubscriptionDetails subscription={latestSubscription} />
      </div>
    </div>
  );
};

export default Page;
