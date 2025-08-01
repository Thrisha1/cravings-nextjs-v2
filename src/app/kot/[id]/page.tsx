"use client";

import { getDateOnly } from "@/lib/formatDate";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { ExtraCharge } from "@/store/posStore";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

const GET_ORDER_QUERY = `
query GetOrder($id: uuid!) {
  orders_by_pk(id: $id) {
    id
    created_at
    table_number
    display_id
    type
    notes
    table_name
    extra_charges
    qr_code{
      table_name
    }
    order_items {
      id
      quantity
      item
    }
  }
}
`;

const PrintKOTPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [isParcel, setIsParcel] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { orders_by_pk } = await fetchFromHasura(GET_ORDER_QUERY, { id });

        if (!orders_by_pk) {
          throw new Error("Order not found");
        }

        const formattedOrder = {
          ...orders_by_pk,
          items: (orders_by_pk.order_items ?? []).map((item: any) => ({
            id: item.id,
            quantity: item.quantity,
            name: item.item.name,
            notes: item.item.kot_notes,
          })),
          tableNumber: orders_by_pk.table_number,
          tableName: orders_by_pk.qr_code?.table_name || orders_by_pk.table_name || null,
          extra_charges: (orders_by_pk.extra_charges ?? []).map(
            (charge: any) => ({
              id: charge.id,
              name: charge.name,
              amount: charge.amount,
            })
          ),
        };

        setOrder(formattedOrder);
        setIsParcel(
          formattedOrder.extra_charges.some(
            (charge: ExtraCharge) => charge.name.toLowerCase() === "parcel"
          )
        );

        // Log the KOT contents in JSON format
        console.log(
          "KOT Contents JSON:",
          JSON.stringify(
            {
              id: formattedOrder.id,
              created_at: formattedOrder.created_at,
              table_number: formattedOrder.tableNumber,
              type: formattedOrder.type,
              notes: formattedOrder.notes,
              items: formattedOrder.items,
            },
            null,
            2
          )
        );
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    onAfterPrint: () => console.log("KOT printed successfully!"),
  });

  useEffect(() => {
    if (!loading && order && printRef.current) {
      handlePrint();
    }
  }, [loading, order, handlePrint]);

  if (loading) return <div>Loading order details...</div>;
  if (error) return <div>{error}</div>;
  if (!order) return <div>Order not found</div>;

  const getOrderTypeText = () => {
    if (order.tableNumber === 0 || order.type === "delivery") return "Delivery";
    if (!order.tableNumber) return "Takeaway";
    return ` ${
      isParcel
        ? `Parcel (Table ${order.tableName || order.tableNumber})`
        : `Table ${order.tableName || order.tableNumber}`
    }`;
  };

  return (
    <div className="p-4">
      <div
        ref={printRef}
        id="printable-content"
        className="kot-template"
        style={{
          fontFamily: "monospace",
          maxWidth: "300px",
          margin: "0 auto",
          padding: "16px",
          backgroundColor: "white",
        }}
      >
        {/* Header */}
        <h2 className="text-xl font-bold text-center uppercase">
          KITCHEN ORDER TICKET
        </h2>
        <div className="border-b border-black my-2"></div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
          <div>
            <span className="font-medium">Order :</span>
            <br />
            <span>
              {(Number(order.display_id) ?? 0) > 0
                ? `${order.display_id}-${getDateOnly(order.created_at)}`
                : order.id.slice(0, 8)}
            </span>
          </div>
          <div className="text-right">
            <span className="font-medium">Type:</span>
            <span> {getOrderTypeText()}</span>
          </div>
          <div>
            <span className="font-medium">Date:</span>
            <span>
              {" "}
              {new Date(order.created_at).toLocaleDateString("en-GB")}
            </span>
          </div>
          <div className="text-right">
            <span className="font-medium">Time:</span>
            <span>
              {" "}
              {new Date(order.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Order Notes */}
        {order.notes && (
          <div className="my-2 p-2">
            <div className="font-bold text-sm">Order Notes:</div>
            <div className="text-sm">{order.notes}</div>
          </div>
        )}

        <div className="border-b border-black my-2"></div>

        {/* Order Items */}
        <h3 className="font-bold text-sm uppercase mb-2">ITEMS:</h3>
        <ul className="space-y-3 text-sm">
          {(order?.items ?? []).map((item: any) => (
            <li key={item.id}>
              <div className="flex justify-between font-medium">
                <span>
                  {item.quantity}x {item.name}
                </span>
              </div>
              {item.notes && (
                <div className="text-xs pl-4 mt-1 italic">- {item.notes}</div>
              )}
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="border-t border-black mt-4 pt-2 text-center text-xs">
          <p>Generated at: {new Date().toLocaleTimeString()}</p>
          {(Number(order.display_id) ?? 0) > 0 && (
            <h2 className="text-xs font-light text-center mt-1">
              ID: {order.id.slice(0, 8)}
            </h2>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrintKOTPage;
