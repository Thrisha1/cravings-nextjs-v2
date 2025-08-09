"use client";

import React from "react";
import { useInventoryStore } from "@/store/inventoryStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const CreateNewPurchasePage = () => {
  const { cancelCreatingPurchase } = useInventoryStore();

  return (
    <div className="space-y-6">
      {/* --- Header --- */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={cancelCreatingPurchase}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Create New Purchase
        </h1>
      </div>

      {/* --- Form Placeholder --- */}
      <Card>
        <CardContent>
          <form className="grid gap-4 py-6">
            {/* purchase date / set current date as default for purchase date*/}
            <div>
              <label htmlFor="purchase-date" className="block text-sm font-medium">
                Purchase Date
              </label>
              <input
                type="date"
                id="purchase-date"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>


            {/* supplier / on typing search from db and show the most relevant 3 in dropdown, aand aalso show create new supplier*/}
            <div>
              <label htmlFor="supplier" className="block text-sm font-medium">
                Supplier
              </label>
              <input
                type="text"
                id="supplier"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="Enter supplier name"
              />
            </div>

            {/* total price */}
            <div>
              <label htmlFor="total-price" className="block text-sm font-medium">
                Total Price
              </label>
              <input
                type="text"
                id="total-price"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500"
                placeholder="Enter total price"
              />
            </div>

            {/* adding purchase items / also create  */}
            <div>
              <label className="block text-sm font-medium">
                Purchase Items
              </label>
              <p className="text-sm text-gray-500 mb-2">
                Add items to this purchase. You can search by item name or category.
              </p>
              {/* Placeholder for adding items, could be a modal or a separate component */}
              <Button variant="outline" className="w-full">
                Add Items
              </Button>
              {/* Placeholder for added items list */}
              <div className="mt-4">
                <p className="text-sm text-gray-500">No items added yet.</p>
              </div>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
};
