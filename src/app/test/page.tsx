"use client";
import { fetchFromHasura } from "@/lib/hasuraClient";
import React from "react";

const GET_ORDER_ITEMS = `
query GetOrderItems {
  order_items(
    where: {
      _and: [
        { order: { partner_id: { _neq: "397fd024-3044-40a7-be52-c82a03f07cbb" } } },
        { 
          _or: [
            { item: { _is_null: true } },
            { item: { _eq: [] } },
             { item: { _eq: {} } }
          ]
        }
      ]
    }
  ) {
    id
    quantity
    menu {
      id
      name
      price
      offers(where: { deletion_status: { _eq: 0 }, end_time: { _gt: "now()" } }) {
        offer_price
      }
    }
    item
  }
}
`;

const UPDATE_ORDER_ITEM = `
  mutation UpdateOrderItem($id: uuid!, $item: jsonb!) {
    update_order_items_by_pk(pk_columns: {id: $id}, _set: {item: $item}) {
      id
      item
    }
  }
`;

interface Offer {
  offer_price: number;
}

interface Menu {
  id: string;
  name: string;
  price: number;
  offers: Offer[];
}

interface OrderItem {
  id: string;
  quantity: number;
  menu: Menu;
  item: {
    id?: string;
    name?: string;
    price?: number;
    offers?: Offer[];
  };
}

const BATCH_SIZE = 20;

const OrderItemsPage = () => {
  const [orderItems, setOrderItems] = React.useState<OrderItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [bulkUpdating, setBulkUpdating] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const fetchOrderItems = async () => {
      try {
        const response = await fetchFromHasura(GET_ORDER_ITEMS);
        setOrderItems(response?.order_items || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderItems();
  }, []);

  const handleUpdateItem = async (orderItem: OrderItem) => {
    setUpdatingId(orderItem.id);
    try {
      const itemData = {
        id: orderItem.menu.id,
        name: orderItem.menu.name,
        price: orderItem.menu.price,
        offers: orderItem.menu.offers,
      };

      await fetchFromHasura(UPDATE_ORDER_ITEM, {
        id: orderItem.id,
        item: itemData,
      });

      setOrderItems((prevItems) =>
        prevItems.map((item) =>
          item.id === orderItem.id ? { ...item, item: itemData } : item
        )
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulkUpdate = async () => {
    setBulkUpdating(true);
    setProgress(0);

    try {
      // Process items in batches
      for (let i = 0; i < orderItems.length; i += BATCH_SIZE) {
        const batch = orderItems.slice(i, i + BATCH_SIZE);
        const updatePromises = batch.map((orderItem) => {
          const itemData = {
            id: orderItem.menu.id,
            name: orderItem.menu.name,
            price: orderItem.menu.price,
            offers: orderItem.menu.offers,
          };

          return fetchFromHasura(UPDATE_ORDER_ITEM, {
            id: orderItem.id,
            item: itemData,
          }).then(() => {
            return { id: orderItem.id, itemData };
          });
        });

        // Wait for the current batch to complete
        const results = await Promise.all(updatePromises);

        // Update local state with the batch results
        setOrderItems((prevItems) =>
          prevItems.map((item) => {
            const updatedItem = results.find((r) => r.id === item.id);
            return updatedItem ? { ...item, item: updatedItem.itemData } : item;
          })
        );

        // Update progress
        setProgress(Math.min(i + BATCH_SIZE, orderItems.length));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBulkUpdating(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const getDisplayData = (orderItem: OrderItem) => {
    if (orderItem.item && orderItem.item.name) {
      return {
        name: orderItem.item.name,
        price: orderItem.item.price,
        offers: orderItem.item.offers || [],
      };
    }
    return {
      name: orderItem.menu.name,
      price: orderItem.menu.price,
      offers: orderItem.menu.offers || [],
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Items</h1>
        <button
          onClick={handleBulkUpdate}
          disabled={bulkUpdating || orderItems.length === 0}
          className={`px-4 py-2 rounded ${
            bulkUpdating
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          {bulkUpdating
            ? `Updating... (${progress}/${orderItems.length})`
            : `Bulk Update All (${orderItems.length} items)`}
        </button>
      </div>

      {bulkUpdating && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${(progress / orderItems.length) * 100}%` }}
          ></div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-200 text-gray-700">
              <th className="py-2 px-4">ID</th>
              <th className="py-2 px-4">Item Name</th>
              <th className="py-2 px-4">Quantity</th>
              <th className="py-2 px-4">Price</th>
              <th className="py-2 px-4">Offer Price</th>
              <th className="py-2 px-4">Current Item JSON</th>
              <th className="py-2 px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {orderItems?.map((orderItem) => {
              const displayData = getDisplayData(orderItem);
              return (
                <tr key={orderItem.id} className="border-b">
                  <td className="py-2 px-4">{orderItem.id}</td>
                  <td className="py-2 px-4">{displayData.name}</td>
                  <td className="py-2 px-4">{orderItem.quantity}</td>
                  <td className="py-2 px-4">
                    ${displayData.price?.toFixed(2)}
                  </td>
                  <td className="py-2 px-4">
                    {displayData.offers?.[0]?.offer_price
                      ? `$${displayData.offers[0].offer_price.toFixed(2)}`
                      : "N/A"}
                  </td>
                  <td className="py-2 px-4 text-xs">
                    <pre>{JSON.stringify(orderItem.item, null, 2)}</pre>
                  </td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => handleUpdateItem(orderItem)}
                      disabled={updatingId === orderItem.id || bulkUpdating}
                      className={`px-4 py-2 rounded ${
                        updatingId === orderItem.id || bulkUpdating
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}
                    >
                      {updatingId === orderItem.id
                        ? "Updating..."
                        : "Update Item"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderItemsPage;
