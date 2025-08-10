"use client";

import React from "react";
import { useInventoryStore } from "@/store/inventoryStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Building, Calendar, Phone, MapPin } from "lucide-react";

export const PurchaseDetail = () => {
  const { selectedPurchase, clearSelectedPurchase } = useInventoryStore();

  if (!selectedPurchase) {
    return null; 
  }

  const { supplier, purchase_date, total_price, purchase_transactions } =
    selectedPurchase;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  return (
    <div className="space-y-6">
      {/* --- Header --- */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={clearSelectedPurchase}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Purchase Details</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* --- Left Side: Items Table --- */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Purchased Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase_transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        {tx.purchase_item.name}
                      </TableCell>
                      <TableCell className="text-right">{tx.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(tx.unit_price)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(tx.quantity * tx.unit_price)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* --- Right Side: Summary & Supplier --- */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purchase Date</span>
                <span className="font-medium">
                  {new Date(purchase_date).toLocaleDateString("en-IN", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="text-xl font-bold">
                  {formatCurrency(total_price)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supplier Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{supplier.name}</span>
              </div>
              {supplier.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{supplier.phone}</span>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <span className="text-muted-foreground">{supplier.address}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};