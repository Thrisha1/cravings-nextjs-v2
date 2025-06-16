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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { usePartnerManagement } from "@/lib/subscriptionManagemenFunctions";
import Link from "next/link";

// Types
export interface Partner {
  id: string;
  phone: string;
  status: "active" | "inactive";
  store_name: string;
}

export interface PartnerSubscription {
  id: string;
  partner_id: string;
  created_at: string;
  plan: "300" | "500" | "flexible" | "growth" | "trial";
  type: "monthly" | "yearly";
  expiry_date: string;
}

export interface PartnerPayment {
  id: string;
  partner_id: string;
  amount: number;
  date: string;
}

// Main component
const SubscriptionManagement = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());

  // Filter states
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [paymentDateSort, setPaymentDateSort] = useState<"nearest" | "oldest">("nearest");

  // Payment calculation state
  const [paymentCalculation, setPaymentCalculation] = useState({
    orderCount: 0,
    orderAmount: 0,
    isCalculating: false,
  });

  const {
    partners,
    subscriptions,
    payments,
    repeatLastPlan,
    loading,
    error,
    currentView,
    selectedPartner,
    searchTerm,
    newSubscription,
    newPayment,
    includePayment,
    getLastSubscription,
    subscriptionPayment,
    hasMorePartners,
    hasMoreSubscriptions,
    hasMorePayments,
    trialStartDate,
    trialEndDate,
    orderCalculation,
    subscriptionStartDate,
    subscriptionEndDate,
    useCustomDates,
    setSearchTerm,
    setNewSubscription,
    setNewPayment,
    setIncludePayment,
    setSubscriptionPayment,
    setTrialStartDate,
    setTrialEndDate,
    setSubscriptionStartDate,
    setSubscriptionEndDate,
    setUseCustomDates,
    fetchPartners,
    applyFilters,
    updatePartnerStatus,
    addSubscription,
    addPayment,
    viewPayments,
    viewAllSubscriptions,
    showAddSubscriptionForm,
    backToList,
    showAddPaymentForm,
    formatDate,
    isActiveSubscription,
    getNearestExpiryDate,
    nextPartners,
    prevPartners,
    nextPayments,
    prevPayments,
    nextSubscriptions,
    prevSubscriptions,
    paymentsOffset,
    subscriptionsOffset,
    partnersOffset,
    setCurrentView,
    calculateOrdersForBillingPeriod,
    checkTrialOverlap,
    deleteSubscription,
    deletePayment,
    getOrderCalculationDetails,
  } = usePartnerManagement();

  // Calculate payment details for flexible/growth plans
  useEffect(() => {
    if (currentView === "addPayment" && selectedPartner) {
      const activeSubscriptions = subscriptions[selectedPartner]?.filter(sub =>
        isActiveSubscription(sub)
      ) || [];
      const hasActiveSubscription = activeSubscriptions.length > 0;
      const activePlan = hasActiveSubscription ? activeSubscriptions[0].plan : null;
      const isFlexibleOrGrowth = activePlan === "flexible" || activePlan === "growth";

      if (isFlexibleOrGrowth && (activePlan === "flexible" || activePlan === "growth")) {
        setPaymentCalculation(prev => ({ ...prev, isCalculating: true }));

        getOrderCalculationDetails(selectedPartner, activePlan as "flexible" | "growth")
          .then((details) => {
            setPaymentCalculation({
              orderCount: details.orderCount,
              orderAmount: details.orderAmount,
              isCalculating: false,
            });
            
            // Update the payment amount with the calculated total
            setNewPayment(prev => ({
              ...prev,
              amount: details.totalAmount,
            }));
          })
          .catch((error: unknown) => {
            console.error("Error calculating payment details:", error);
            setPaymentCalculation({
              orderCount: 0,
              orderAmount: 0,
              isCalculating: false,
            });
            
            // Reset payment amount on error
            setNewPayment(prev => ({
              ...prev,
              amount: 0,
            }));
          });
      } else {
        // Reset calculation for non-flexible/growth plans
        setPaymentCalculation({
          orderCount: 0,
          orderAmount: 0,
          isCalculating: false,
        });
      }
    }
  }, [currentView, selectedPartner, subscriptions, getOrderCalculationDetails, isActiveSubscription, setNewPayment]);

  // Handle filter changes
  const handleFilterChange = (newStatusFilter?: "all" | "active" | "inactive", newPaymentDateSort?: "nearest" | "oldest") => {
    const status = newStatusFilter || statusFilter;
    const sort = newPaymentDateSort || paymentDateSort;

    if (newStatusFilter) setStatusFilter(newStatusFilter);
    if (newPaymentDateSort) setPaymentDateSort(newPaymentDateSort);

    applyFilters(status, sort);
  };

  // Add Subscription Form Component
  if (currentView === "addSubscription" && selectedPartner) {
    const partner = partners.find((p) => p.id === selectedPartner);

    return (
      <div className="p-6">
        <Button onClick={backToList} variant="outline" className="mb-4">
          Back to Partners
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Add Subscription for {partner?.store_name}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            <div className="space-y-6">
              {/* Subscription Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plan">Plan</Label>
                  <Select
                    value={newSubscription.plan}
                    onValueChange={(value: "300" | "500" | "flexible" | "growth" | "trial") => {
                      setNewSubscription({
                        ...newSubscription,
                        plan: value,
                      });

                      // Calculate orders for flexible and growth plans
                      if ((value === "flexible" || value === "growth") && selectedPartner) {
                        const startDate = new Date();
                        const endDate = newSubscription.type === "monthly"
                          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                        calculateOrdersForBillingPeriod(selectedPartner, startDate, endDate);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">₹300 - Basic</SelectItem>
                      <SelectItem value="500">₹500 - Premium</SelectItem>
                      <SelectItem value="flexible">Flexible - Pay per Order</SelectItem>
                      <SelectItem value="growth">Growth - Orders + ₹500</SelectItem>
                      <SelectItem value="trial">Trial Plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newSubscription.type}
                    onValueChange={(value: "monthly" | "yearly") =>
                      setNewSubscription({
                        ...newSubscription,
                        type: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Order Calculation Display for Flexible/Growth Plans */}
              {(newSubscription.plan === "flexible" || newSubscription.plan === "growth") && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Order-Based Pricing Calculation</h4>
                  {orderCalculation.isCalculating ? (
                    <p className="text-blue-700">Calculating orders...</p>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Valid Orders in Billing Period:</span>
                        <span className="font-medium">{orderCalculation.orderCount} orders</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Order Charges (₹10 per order):</span>
                        <span className="font-medium">₹{orderCalculation.orderAmount}</span>
                      </div>
                      {newSubscription.plan === "growth" && (
                        <>
                          <div className="flex justify-between">
                            <span>Base Growth Plan Fee:</span>
                            <span className="font-medium">₹{orderCalculation.growthBaseAmount}</span>
                          </div>
                          <hr className="border-blue-300" />
                          <div className="flex justify-between font-semibold text-blue-900">
                            <span>Total Amount:</span>
                            <span>₹{orderCalculation.orderAmount + orderCalculation.growthBaseAmount}</span>
                          </div>
                        </>
                      )}
                      {newSubscription.plan === "flexible" && (
                        <div className="flex justify-between font-semibold text-blue-900">
                          <span>Total Amount:</span>
                          <span>₹{orderCalculation.orderAmount}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Trial Plan Date Selection */}
              {newSubscription.plan === "trial" && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-4">
                  <h4 className="font-medium text-green-900 mb-2">Trial Period Selection</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Trial Start Date</Label>
                      <Input
                        type="date"
                        value={trialStartDate.toISOString().split('T')[0]}
                        onChange={(e) => {
                          if (e.target.value) {
                            setTrialStartDate(new Date(e.target.value));
                          }
                        }}
                      />
                    </div>
                    <div>
                      <Label>Trial End Date</Label>
                      <Input
                        type="date"
                        value={trialEndDate ? trialEndDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          if (e.target.value && selectedPartner) {
                            const newDate = new Date(e.target.value);
                            // Check for overlaps
                            const hasOverlap = checkTrialOverlap(selectedPartner, trialStartDate, newDate);
                            if (hasOverlap) {
                              alert("Trial period overlaps with existing trial. Please select different dates.");
                              return;
                            }
                            setTrialEndDate(newDate);
                          }
                        }}
                      />
                    </div>
                  </div>
                  {trialStartDate && trialEndDate && (
                    <div className="text-sm text-green-700 bg-green-100 p-2 rounded">
                      <strong>Trial Duration:</strong> {Math.ceil((trialEndDate.getTime() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24))} days
                      <br />
                      <strong>Note:</strong> Full access with no charges during trial period
                    </div>
                  )}
                </div>
              )}

              {/* Subscription Date Selection */}
              {newSubscription.plan !== "trial" && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useCustomDates"
                      checked={useCustomDates}
                      onCheckedChange={(checked) => {
                        setUseCustomDates(checked as boolean);
                        if (!checked) {
                          // Reset to default (today)
                          setSubscriptionStartDate(new Date());
                          setSubscriptionEndDate(undefined);
                        }
                      }}
                    />
                    <Label htmlFor="useCustomDates" className="font-medium">
                      Set custom subscription dates
                    </Label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Subscription Start Date</Label>
                      <Input
                        type="date"
                        value={subscriptionStartDate.toISOString().split('T')[0]}
                        onChange={(e) => {
                          if (e.target.value) {
                            const newDate = new Date(e.target.value);
                            setSubscriptionStartDate(newDate);
                            // Auto-calculate end date if not using custom end date
                            if (!useCustomDates || !subscriptionEndDate) {
                              const endDate = newSubscription.type === "monthly"
                                ? new Date(newDate.getTime() + 30 * 24 * 60 * 60 * 1000)
                                : new Date(newDate.getTime() + 365 * 24 * 60 * 60 * 1000);
                              setSubscriptionEndDate(endDate);
                            }
                          }
                        }}
                      />
                    </div>

                    {useCustomDates && (
                      <div>
                        <Label>Subscription End Date</Label>
                        <Input
                          type="date"
                          value={subscriptionEndDate ? subscriptionEndDate.toISOString().split('T')[0] : ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              setSubscriptionEndDate(new Date(e.target.value));
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {!useCustomDates && (
                    <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                      <strong>Auto-calculated:</strong> End date will be {newSubscription.type === "monthly" ? "1 month" : "1 year"} from start date
                    </div>
                  )}

                  {subscriptionStartDate && subscriptionEndDate && (
                    <div className="text-sm text-gray-700 bg-green-50 p-2 rounded">
                      <strong>Subscription Period:</strong> {format(subscriptionStartDate, "PPP")} to {format(subscriptionEndDate, "PPP")}
                      <br />
                      <strong>Duration:</strong> {Math.ceil((subscriptionEndDate.getTime() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24))} days
                    </div>
                  )}
                </div>
              )}

              {/* Payment Option */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includePayment"
                    checked={includePayment}
                    onCheckedChange={(checked) =>
                      setIncludePayment(checked as boolean)
                    }
                  />
                  <Label htmlFor="includePayment">
                    Add payment with subscription
                  </Label>
                </div>

                {includePayment && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                    <div>
                      <Label htmlFor="paymentAmount">Payment Amount</Label>
                      <Input
                        id="paymentAmount"
                        type="number"
                        value={subscriptionPayment.amount}
                        onChange={(e) =>
                          setSubscriptionPayment({
                            ...subscriptionPayment,
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Payment Date</Label>
                      <Input
                        type="date"
                        value={paymentDate ? paymentDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          if (e.target.value) {
                            const selectedDate = new Date(e.target.value);
                            setPaymentDate(selectedDate);
                            setSubscriptionPayment({
                              ...subscriptionPayment,
                              date: selectedDate.toISOString().split("T")[0],
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button onClick={addSubscription} disabled={loading}>
                  Add Subscription {includePayment ? "& Payment" : ""}
                </Button>
                <Button variant="outline" onClick={backToList}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All Subscriptions View Component
  if (currentView === "allSubscriptions" && selectedPartner) {
    const partner = partners.find((p) => p.id === selectedPartner);
    const partnerSubscriptions = subscriptions[selectedPartner] || [];
    const currentOffset = subscriptionsOffset[selectedPartner] || 0;
    const hasMore = hasMoreSubscriptions[selectedPartner] || false;

    return (
      <div className="p-6">
        <Button onClick={backToList} variant="outline" className="mb-4">
          Back to Partners
        </Button>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Subscriptions for {partner?.store_name}</CardTitle>
              <Button onClick={() => showAddSubscriptionForm(selectedPartner)}>
                Add Subscription
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partnerSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell>{subscription.plan}</TableCell>
                    <TableCell className="capitalize">
                      {subscription.type}
                    </TableCell>
                    <TableCell>{formatDate(subscription.created_at)}</TableCell>
                    <TableCell>
                      {formatDate(subscription.expiry_date)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${isActiveSubscription(subscription)
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                          }`}
                      >
                        {isActiveSubscription(subscription)
                          ? "Active"
                          : "Expired"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (window.confirm("Are you sure you want to delete this subscription? This action cannot be undone.")) {
                            const success = await deleteSubscription(subscription.id, selectedPartner);
                            if (success) {
                              // Refresh the data
                              fetchPartners(partnersOffset, true);
                            }
                          }
                        }}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination for subscriptions */}
            <div className="flex justify-between items-center mt-4">
              <Button
                onClick={() => prevSubscriptions(selectedPartner)}
                disabled={currentOffset === 0 || loading}
                variant="outline"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Showing {currentOffset + 1}-
                {currentOffset + partnerSubscriptions.length} subscriptions
              </span>
              <Button
                onClick={() => nextSubscriptions(selectedPartner)}
                disabled={!hasMore || loading}
                variant="outline"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Add Payment Form Component
  if (currentView === "addPayment" && selectedPartner) {
    const partner = partners.find((p) => p.id === selectedPartner);
    const activeSubscriptions = subscriptions[selectedPartner]?.filter(sub =>
      isActiveSubscription(sub)
    ) || [];
    const hasActiveSubscription = activeSubscriptions.length > 0;
    const activePlan = hasActiveSubscription ? activeSubscriptions[0].plan : null;
    const isFlexibleOrGrowth = activePlan === "flexible" || activePlan === "growth";

    return (
      <div className="p-6">
        <Button
          onClick={() => setCurrentView("payments")}
          variant="outline"
          className="mb-4"
        >
          Back to Payment History
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Add Payment for {partner?.store_name}</CardTitle>
            {hasActiveSubscription && !isFlexibleOrGrowth && (
              <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                💡 Amount auto-filled based on current active subscription: {activePlan} plan
              </div>
            )}
            {hasActiveSubscription && isFlexibleOrGrowth && (
              <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                🔄 Amount calculated based on completed orders since last payment
              </div>
            )}
            {!hasActiveSubscription && newPayment.amount === 0 && (
              <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                ⚠️ No active subscription found. Please enter payment amount manually.
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            {/* Order Calculation Display for Flexible/Growth Plans */}
            {isFlexibleOrGrowth && hasActiveSubscription && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
                <h4 className="font-medium text-blue-900 mb-3">Payment Calculation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Completed Orders (since last payment):</span>
                    <span className="font-medium">
                      {paymentCalculation.isCalculating ? "Calculating..." : `${paymentCalculation.orderCount} orders`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Charges (₹10 per order):</span>
                    <span className="font-medium">₹{paymentCalculation.orderAmount}</span>
                  </div>
                  {activePlan === "growth" && (
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
                    <span>₹{activePlan === "growth" ? paymentCalculation.orderAmount + 500 : paymentCalculation.orderAmount}</span>
                  </div>
                  <div className="text-xs text-blue-600 mt-2">
                    * Only completed orders since last payment are counted. Pending and cancelled orders are excluded.
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">
                  Payment Amount
                  {hasActiveSubscription && !isFlexibleOrGrowth && (
                    <span className="text-green-600 font-medium">
                      (Auto-filled from {activePlan} plan)
                    </span>
                  )}
                  {isFlexibleOrGrowth && (
                    <span className="text-blue-600 font-medium">
                      (Calculated from orders)
                    </span>
                  )}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) =>
                    setNewPayment({
                      ...newPayment,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={hasActiveSubscription ? (isFlexibleOrGrowth ? "border-blue-300 bg-blue-50" : "border-green-300 bg-green-50") : ""}
                />
                {hasActiveSubscription && (
                  <div className="text-xs text-gray-600 mt-1">
                    You can modify this amount if needed
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date ? date.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      const selectedDate = new Date(e.target.value);
                      setDate(selectedDate);
                      setNewPayment({
                        ...newPayment,
                        date: selectedDate.toISOString().split("T")[0],
                      });
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex space-x-2 mt-6">
              <Button onClick={addPayment} disabled={loading}>
                Add Payment
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentView("payments")}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Payment History Component
  if (currentView === "payments" && selectedPartner) {
    const partner = partners.find((p) => p.id === selectedPartner);
    const partnerPayments = payments[selectedPartner] || [];
    const currentOffset = paymentsOffset[selectedPartner] || 0;
    const hasMore = hasMorePayments[selectedPartner] || false;

    return (
      <div className="p-6">
        <Button onClick={backToList} variant="outline" className="mb-4">
          Back to Partners
        </Button>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Payments for {partner?.store_name}</CardTitle>
              <div className="flex gap-2">
                <Button onClick={() => showAddPaymentForm()}>
                  Add Payment
                </Button>
              </div>
            </div>
            {/* Show current active subscription info */}
            {(() => {
              const activeSubscriptions = subscriptions[selectedPartner]?.filter(sub =>
                isActiveSubscription(sub)
              ) || [];
              if (activeSubscriptions.length > 0) {
                const activeSub = activeSubscriptions[0];
                return (
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded mt-2">
                    📋 Current Active Plan: ₹{activeSub.plan} ({activeSub.type}) - Expires {formatDate(activeSub.expiry_date)}
                  </div>
                );
              }
              return (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">
                  ℹ️ No active subscription found for this partner
                </div>
              );
            })()}
          </CardHeader>
          <CardContent>
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partnerPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>₹{payment.amount}</TableCell>
                    <TableCell>{formatDate(payment.date)}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (window.confirm("Are you sure you want to delete this payment? This action cannot be undone.")) {
                            const success = await deletePayment(payment.id, selectedPartner);
                            if (success) {
                              // Refresh payments data
                              viewPayments(selectedPartner);
                            }
                          }
                        }}
                        disabled={loading}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination for payments */}
            <div className="flex justify-between items-center mt-4">
              <Button
                onClick={() => prevPayments(selectedPartner)}
                disabled={currentOffset === 0 || loading}
                variant="outline"
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Showing {currentOffset + 1}-
                {currentOffset + partnerPayments.length} payments
              </span>
              <Button
                onClick={() => nextPayments(selectedPartner)}
                disabled={!hasMore || loading}
                variant="outline"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Partners List
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Partner Subscriptions</CardTitle>
            <Button
              onClick={() => fetchPartners(partnersOffset, true)}
              variant="outline"
            >
              Refresh
            </Button>
          </div>

          {/* Filter Controls */}
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search partners by name or phone"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="min-w-[150px]">
                <Label htmlFor="statusFilter" className="text-sm font-medium">
                  Partner Status
                </Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value: "all" | "active" | "inactive") =>
                    handleFilterChange(value, undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Partners</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[150px]">
                <Label htmlFor="paymentDateSort" className="text-sm font-medium">
                  Sort by Expiry
                </Label>
                <Select
                  value={paymentDateSort}
                  onValueChange={(value: "nearest" | "oldest") =>
                    handleFilterChange(undefined, value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nearest">Nearest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active Subscriptions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((partner) => {
                const activeSubscriptions = getLastSubscription(partner.id);
                const nearestExpiry = getNearestExpiryDate(partner.id);

                return (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <Link
                        className="underline text-orange-600"
                        href={`/hotels/${partner.store_name}/${partner.id}`}
                      >
                        {partner.store_name}
                      </Link>
                    </TableCell>
                    <TableCell>{partner.phone}</TableCell>
                    <TableCell>
                      <Select
                        value={partner.status}
                        onValueChange={(value: "active" | "inactive") =>
                          updatePartnerStatus(partner.id, value)
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        {activeSubscriptions ? (
                          isActiveSubscription(activeSubscriptions) ? (
                            // Active subscription display
                            <div className="text-sm">
                              <span className="font-medium">
                                {activeSubscriptions.plan} plan
                              </span>{" "}
                              ({activeSubscriptions.type}) - Expires{" "}
                              {formatDate(activeSubscriptions.expiry_date)}
                              {activeSubscriptions.expiry_date ===
                                nearestExpiry && (
                                  <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                    Nearest
                                  </span>
                                )}
                            </div>
                          ) : (
                            // Expired subscription display
                            <div className="text-sm">
                              <span className="font-medium line-through">
                                {activeSubscriptions.plan} plan
                              </span>{" "}
                              <span className="text-red-500">
                                ({activeSubscriptions.type}) - Expired on{" "}
                                {formatDate(activeSubscriptions.expiry_date)}
                              </span>
                              <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                                Expired
                              </span>
                            </div>
                          )
                        ) : (
                          <span className="text-gray-500">
                            No subscriptions
                          </span>
                        )}

                        {/* Always show nearest expiry date prominently */}
                        {nearestExpiry && (
                          <div className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
                            <strong>Next Expiry:</strong> {formatDate(nearestExpiry)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewPayments(partner.id)}
                        >
                          View Payments
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewAllSubscriptions(partner.id)}
                        >
                          All Subscriptions
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => repeatLastPlan(partner.id, true)}
                        >
                          Repeat Last Plan
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Show filter results count */}
          <div className="mt-2 text-sm text-gray-600">
            Showing {partners.length} partners
            {statusFilter !== "all" && ` (${statusFilter} only)`}
          </div>

          {/* Pagination for partners */}
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={() => prevPartners(statusFilter, paymentDateSort)}
              disabled={partnersOffset === 0 || loading}
              variant="outline"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Showing {partnersOffset + 1}-{partnersOffset + partners.length}{" "}
              partners
            </span>
            <Button
              onClick={() => nextPartners(statusFilter, paymentDateSort)}
              disabled={!hasMorePartners || loading}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManagement;
