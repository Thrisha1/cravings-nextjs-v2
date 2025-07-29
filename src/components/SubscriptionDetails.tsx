"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Subscription } from "@/app/renew-subscription/page";
import {
  createPayment,
  paymentAuth,
  checkPaymentStatus,
} from "@/app/renew-subscription/paymentFuctions";
import { v4 as uuid } from "uuid";
import { CheckCircle } from "lucide-react";
import { fetchFromHasura } from "@/lib/hasuraClient";

interface QRData {
  status: boolean;
  qrcode: string;
  link: {
    bhim: string;
    phonepe: string;
    paytm: string;
    gpay: string;
  };
  ref_id: string;
  data: {
    company_name: string;
    amount: number;
    type: string;
    payment_status: string;
  };
}

const SubscriptionDetails = ({
  subscription,
}: {
  subscription: Subscription | null;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<QRData | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    if (!qrCodeData) return;

    const intervalId = setInterval(async () => {
      try {
        const data = await checkPaymentStatus();   
        console.log("Payment status data:", data);     
        if (data && data.payment_status === "paid") {
          clearInterval(intervalId);
          addSubscription(data);
        }
      } catch (err) {
        console.error("Error checking payment status:", err);
        setError("Failed to verify payment. Please try again.");
        clearInterval(intervalId);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [qrCodeData]);

  const addSubscription = async (paymentData: any) => {
    if (!subscription) {
      console.error("No subscription data available to process.");
      return;
    }

    console.log("Adding subscription with payment data:", paymentData);

    const paymentRecord = {
      id: paymentData.id,
      partner_id: subscription.partner.id,
      date: new Date().toISOString(),
      amount: subscription.plan,
      created_at: new Date().toISOString(),
    };

    const now = new Date();
    const expiryDate = new Date(now);

    if (subscription.type === "monthly") {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (subscription.type === "yearly") {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    const subscriptionRecord = {
      partner_id: subscription.partner.id,
      created_at: now.toISOString(),
      expiry_date: expiryDate.toISOString(),
      type: subscription.type,
      plan: subscription.plan,
    };

    await fetchFromHasura(
      `
      mutation AddSubscriptionAndPayment($payment: partner_payments_insert_input!, $subscription: partner_subscriptions_insert_input!) {
        insert_partner_payments_one(object: $payment) {
          id
        }
        insert_partner_subscriptions_one(object: $subscription) {
          id
        }
      }
    `,
      {
        payment: paymentRecord,
        subscription: subscriptionRecord,
      }
    );

    setQrCodeData(null);
    setIsPaid(true);
  };

  const handleRenew = async () => {
    if (!subscription) return;

    setIsLoading(true);
    setError(null);

    try {
      const paymentId = uuid();
      await paymentAuth();
      const qrData = await createPayment({
        amount: (Number(subscription.plan) / 100).toString(),
        order_id: paymentId,
        callback_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/renew-subscription`,
        customer_details: {
          email: subscription.partner.email,
          mobile: subscription.partner.phone,
          name: subscription.partner.store_name,
        },
      });

      if (qrData && qrData.status) {
        setQrCodeData(qrData);
      } else {
        throw new Error("Failed to generate payment QR code.");
      }
    } catch (err: any) {
      console.error("Payment initiation failed:", err);
      setError(err.message || "Could not connect to the payment service.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPayment = () => {
    setQrCodeData(null);
    setError(null);
  };

  const handleDone = () => {
    window.location.reload();
  };

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Subscription Found</CardTitle>
          <CardDescription>
            You do not have any active or past subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Please select a plan to get started.
          </p>
        </CardContent>
        <CardFooter>
          <Button>Explore Plans</Button>
        </CardFooter>
      </Card>
    );
  }

  const expiryDate = new Date(subscription.expiry_date);
  const now = new Date();
  const isExpired = expiryDate < now;

  const formattedExpiryDate = expiryDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {isPaid
            ? "Payment Successful"
            : qrCodeData
            ? "Complete Your Payment"
            : "Subscription Details"}
        </CardTitle>
        <CardDescription>
          {isPaid
            ? "Your subscription is now active."
            : qrCodeData
            ? `Scan the QR code to renew for ₹${subscription.plan}`
            : "Manage your plan and billing details."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md"
            role="alert"
          >
            <strong className="font-bold">Error:</strong>
            <span> {error}</span>
          </div>
        )}

        {isPaid ? (
          <div className="flex flex-col items-center gap-4 text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500" />
            <p className="text-lg font-medium">Thank you for your payment!</p>
            <p className="text-sm text-gray-500">
              Your subscription has been renewed.
            </p>
          </div>
        ) : qrCodeData ? (
          <div className="flex flex-col items-center gap-4">
            <div className="p-2 bg-white rounded-lg border">
              <img
                src={`data:image/png;base64,${qrCodeData.qrcode}`}
                alt="Payment QR Code"
                className="w-56 h-56"
              />
            </div>
            <p className="text-sm text-center text-gray-500 animate-pulse">
              Waiting for payment confirmation...
            </p>
            <div className="flex items-center gap-4">
              <a
                href={qrCodeData.link.gpay}
                className="text-blue-600 hover:underline"
              >
                GPay
              </a>
              <a
                href={qrCodeData.link.phonepe}
                className="text-purple-600 hover:underline"
              >
                PhonePe
              </a>
              <a
                href={qrCodeData.link.paytm}
                className="text-blue-500 hover:underline"
              >
                Paytm
              </a>
            </div>

            <div onClick={addSubscription}>add subscription</div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Plan</span>
              <span className="font-medium">
                ₹{subscription.plan} / {subscription.type}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Status</span>
              {isExpired ? (
                <Badge variant="destructive">Expired</Badge>
              ) : (
                <Badge variant="default">Active</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">
                {isExpired ? "Expired On" : "Expires On"}
              </span>
              <span className="font-medium">{formattedExpiryDate}</span>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {isPaid ? (
          <Button className="w-full" onClick={handleDone}>
            Done
          </Button>
        ) : qrCodeData ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCancelPayment}
          >
            Cancel Payment
          </Button>
        ) : isExpired ? (
          <Button className="w-full" onClick={handleRenew} disabled={isLoading}>
            {isLoading ? "Processing..." : "Renew Now"}
          </Button>
        ) : (
          <p className="text-xs text-center w-full text-gray-500 dark:text-gray-400">
            Your subscription is up to date.
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

export default SubscriptionDetails;
