"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isAfter } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { ArrowLeft, Calendar, CreditCard, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Subscription {
  id: string;
  plan: "300" | "500" | "flexible" | "growth" | "trial";
  type: "monthly" | "yearly";
  created_at: string;
  expiry_date: string;
}

interface Payment {
  id: string;
  amount: number;
  date: string;
}

interface OrderCalculationDetails {
  orderCount: number;
  orderAmount: number;
  totalAmount: number;
}

const BillingPage = () => {
  const { userData } = useAuthStore();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderCalculation, setOrderCalculation] = useState<OrderCalculationDetails>({
    orderCount: 0,
    orderAmount: 0,
    totalAmount: 0,
  });
  const [calculatingOrders, setCalculatingOrders] = useState(false);

  // Get current active subscription
  const activeSubscription = subscriptions.find(sub => 
    isAfter(new Date(sub.expiry_date), new Date())
  );

  const isFlexibleOrGrowth = activeSubscription?.plan === "flexible" || activeSubscription?.plan === "growth";

  useEffect(() => {
    if (userData?.role === "partner") {
      fetchBillingData();
    }
  }, [userData]);

  useEffect(() => {
    if (activeSubscription && isFlexibleOrGrowth) {
      calculateOrdersForBilling();
    }
  }, [activeSubscription, isFlexibleOrGrowth]);

  const fetchBillingData = async () => {
    if (!userData?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch subscriptions
      const subscriptionsResponse = await fetchFromHasura(
        `query GetPartnerSubscriptions($partnerId: uuid!) {
          partner_subscriptions(
            where: {partner_id: {_eq: $partnerId}}, 
            order_by: {created_at: desc}
          ) {
            id
            plan
            type
            created_at
            expiry_date
          }
        }`,
        { partnerId: userData.id }
      );

      // Fetch payments
      const paymentsResponse = await fetchFromHasura(
        `query GetPartnerPayments($partnerId: uuid!) {
          partner_payments(
            where: {partner_id: {_eq: $partnerId}}, 
            order_by: {date: desc}
          ) {
            id
            amount
            date
          }
        }`,
        { partnerId: userData.id }
      );

      setSubscriptions(subscriptionsResponse.partner_subscriptions || []);
      setPayments(paymentsResponse.partner_payments || []);
    } catch (err) {
      setError("Failed to fetch billing data");
      console.error(err);
      toast.error("Failed to load billing information");
    } finally {
      setLoading(false);
    }
  };

  const calculateOrdersForBilling = async () => {
    if (!userData?.id || !activeSubscription) return;

    setCalculatingOrders(true);

    try {
      // Calculate billing period bounds
      const subscriptionStart = new Date(activeSubscription.created_at);
      const subscriptionExpiry = new Date(activeSubscription.expiry_date);
      const now = new Date();
      
      // For payment calculation, we look at orders since last payment (or subscription start if no payments)
      const lastPaymentDate = payments.length > 0 
        ? new Date(Math.max(...payments.map(p => new Date(p.date).getTime())))
        : null;

      // Start date: last payment date or subscription start (whichever is later)
      const startDate = lastPaymentDate && isAfter(lastPaymentDate, subscriptionStart) 
        ? lastPaymentDate 
        : subscriptionStart;

      // End date: current date or subscription expiry (whichever is earlier)
      const endDate = isAfter(subscriptionExpiry, now) ? now : subscriptionExpiry;

      // Ensure start date is not after end date
      if (isAfter(startDate, endDate)) {
        setOrderCalculation({ orderCount: 0, orderAmount: 0, totalAmount: 0 });
        return;
      }

      // Fetch orders within the payment calculation period
      const ordersResponse = await fetchFromHasura(
        `query GetPartnerOrdersForBilling($partnerId: uuid!, $startDate: timestamptz!, $endDate: timestamptz!) {
          orders(
            where: {
              partner_id: { _eq: $partnerId }
              created_at: { _gte: $startDate, _lte: $endDate }
              status: { _in: ["completed", "pending"] }
              type: { _eq: "delivery" }
            }
          ) {
            id
            status
            created_at
            total_price
          }
        }`,
        {
          partnerId: userData.id,
          startDate: format(startDate, "yyyy-MM-dd'T'00:00:00.000'Z'"),
          endDate: format(endDate, "yyyy-MM-dd'T'23:59:59.999'Z'"),
        }
      );

      if (ordersResponse.errors) {
        throw new Error(ordersResponse.errors[0]?.message || "Failed to fetch orders");
      }

      const completedOrders = ordersResponse.orders || [];
      const orderCount = completedOrders.length;
      const orderAmount = orderCount * 10; // ₹10 per completed order

      let totalAmount = orderAmount;
      if (activeSubscription.plan === "growth") {
        totalAmount = orderAmount + 500; // Order charges + ₹500 base fee
      }

      setOrderCalculation({ orderCount, orderAmount, totalAmount });
    } catch (error) {
      console.error("Error calculating orders:", error);
      toast.error("Failed to calculate order-based billing");
      setOrderCalculation({ orderCount: 0, orderAmount: 0, totalAmount: 0 });
    } finally {
      setCalculatingOrders(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const isActiveSubscription = (subscription: Subscription) => {
    return isAfter(new Date(subscription.expiry_date), new Date());
  };

  const getAmountDue = () => {
    if (!activeSubscription) return 0;
    
    if (activeSubscription.plan === "trial") return 0;
    if (activeSubscription.plan === "flexible") return orderCalculation.totalAmount;
    if (activeSubscription.plan === "growth") return orderCalculation.totalAmount;
    
    return parseInt(activeSubscription.plan);
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case "300": return "₹300 - Basic Plan";
      case "500": return "₹500 - Premium Plan";
      case "flexible": return "Flexible - Pay per Order";
      case "growth": return "Growth - Orders + ₹500";
      case "trial": return "Trial Plan";
      default: return plan;
    }
  };

  if (!userData || userData.role !== "partner") {
    router.push("/");
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading billing information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Billing Overview</h1>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Subscription Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSubscription ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Plan</div>
                    <div className="text-lg font-semibold text-green-800">
                      {getPlanName(activeSubscription.plan)}
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Type</div>
                    <div className="text-lg font-semibold text-blue-800 capitalize">
                      {activeSubscription.type}
                    </div>
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="text-sm text-orange-600 font-medium">Expires</div>
                    <div className="text-lg font-semibold text-orange-800">
                      {formatDate(activeSubscription.expiry_date)}
                    </div>
                  </div>
                </div>

                {/* Order-Based Calculation for Flexible/Growth Plans */}
                {isFlexibleOrGrowth && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3">Current Billing Period Calculation</h4>
                    {calculatingOrders ? (
                      <p className="text-blue-700">Calculating orders...</p>
                    ) : (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Completed Orders (since last payment):</span>
                          <span className="font-medium">{orderCalculation.orderCount} orders</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Order Charges (₹10 per order):</span>
                          <span className="font-medium">₹{orderCalculation.orderAmount}</span>
                        </div>
                        {activeSubscription.plan === "growth" && (
                          <>
                            <div className="flex justify-between">
                              <span>Base Growth Plan Fee:</span>
                              <span className="font-medium">₹500</span>
                            </div>
                            <hr className="border-blue-300" />
                          </>
                        )}
                        <div className="flex justify-between font-semibold text-blue-900">
                          <span>Total Amount Due:</span>
                          <span>₹{orderCalculation.totalAmount}</span>
                        </div>
                        <div className="text-xs text-blue-600 mt-2">
                          * Only completed delivery orders since last payment are counted.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Amount Due */}
                <div className="p-4 bg-gray-50 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-700">
                      {isFlexibleOrGrowth ? "Current Amount Due:" : "Plan Amount:"}
                    </span>
                    <span className="text-2xl font-bold text-orange-600">
                      ₹{getAmountDue()}
                    </span>
                  </div>
                  {activeSubscription.plan === "trial" && (
                    <p className="text-sm text-green-600 mt-2">Trial period - No payment required</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Active Subscription</h3>
                <p>You don't have any active subscription at the moment.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.slice(0, 10).map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">₹{payment.amount}</TableCell>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            Completed
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {payments.length > 10 && (
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Showing latest 10 payments
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Payment History</h3>
                <p>No payments have been made yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription History */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription History</CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">
                          {getPlanName(subscription.plan)}
                        </TableCell>
                        <TableCell className="capitalize">{subscription.type}</TableCell>
                        <TableCell>{formatDate(subscription.created_at)}</TableCell>
                        <TableCell>{formatDate(subscription.expiry_date)}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              isActiveSubscription(subscription)
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {isActiveSubscription(subscription) ? "Active" : "Expired"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <h3 className="text-lg font-medium text-gray-700 mb-2">No Subscription History</h3>
                <p>No subscriptions found for your account.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingPage; 