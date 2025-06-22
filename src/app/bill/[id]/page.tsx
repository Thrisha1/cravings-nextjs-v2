"use client";

import { QrGroup } from "@/app/admin/qr-management/page";
import { getGstAmount } from "@/components/hotelDetail/OrderDrawer";
import { getExtraCharge } from "@/lib/getExtraCharge";
import { fetchFromHasura } from "@/lib/hasuraClient";
import { OrderItem } from "@/store/orderStore";
import { ExtraCharge } from "@/store/posStore";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

const GET_ORDER_QUERY = `
query GetOrder($id: uuid!) {
  orders_by_pk(id: $id) {
    id
    total_price
    created_at
    notes
    table_number
    qr_id
    type
    delivery_address
    delivery_location
    status
    status_history
    partner_id
    partner {
      gst_percentage
      currency
      store_name
      district
      phone
      gst_no
      name
    }
    gst_included
    extra_charges
    phone
    user_id
    user {
      full_name
      phone
      email
    }
    order_items {
      id
      quantity
      item
    }
  }
}
`;

const PrintOrderPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { orders_by_pk } = await fetchFromHasura(GET_ORDER_QUERY, { id });
        
        if (!orders_by_pk) {
          throw new Error("Order not found");
        }

        const formattedOrder = {
          ...orders_by_pk,
          items: orders_by_pk.order_items.map((item: any) => ({
            id: item.id,
            quantity: item.quantity,
            name: item.item.name,
            price: item.item.price,
          })),
          extra_charges: orders_by_pk.extra_charges || [],
          tableNumber: orders_by_pk.table_number, // Ensure this matches your usage
          deliveryAddress: orders_by_pk.delivery_address, // Ensure this matches your usage
        };

        setOrder(formattedOrder);
        
        // Calculate amounts for logging
        const foodSubtotal = formattedOrder.items.reduce(
          (sum: number, item: OrderItem) => sum + item.price * item.quantity, 0
        );
        
        const chargesSubtotal = formattedOrder.extra_charges.reduce(
          (sum: number, charge: any) => 
            sum + getExtraCharge(
              formattedOrder.items || [],
              charge.amount || 0,
              charge.charge_type as QrGroup["charge_type"]
            ), 0
        );
        
        const gstPercentage = formattedOrder.partner?.gst_percentage || 0;
        const subtotal = foodSubtotal + chargesSubtotal;
        const gstAmount = (foodSubtotal * gstPercentage) / 100;
        const grandTotal = subtotal + gstAmount;
        
        // Log the bill contents in JSON format
        console.log('Bill Contents JSON:', JSON.stringify({
          id: formattedOrder.id,
          created_at: formattedOrder.created_at,
          store_name: formattedOrder.partner?.store_name,
          district: formattedOrder.partner?.district,
          phone: formattedOrder.partner?.phone,
          table_number: formattedOrder.tableNumber,
          type: formattedOrder.type,
          delivery_address: formattedOrder.deliveryAddress,
          delivery_location: formattedOrder.delivery_location ? {
            coordinates: formattedOrder.delivery_location.coordinates,
            google_maps_link: `https://www.google.com/maps/place/${formattedOrder.delivery_location.coordinates[1]},${formattedOrder.delivery_location.coordinates[0]}`
          } : null,
          order_items: formattedOrder.items,
          extra_charges: formattedOrder.extra_charges,
          customer_phone: formattedOrder.phone,
          customer_name: formattedOrder.user?.full_name,
          calculations: {
            food_subtotal: foodSubtotal,
            charges_subtotal: chargesSubtotal,
            subtotal: subtotal,
            gst_percentage: gstPercentage,
            gst_amount: gstAmount,
            grand_total: grandTotal
          },
          currency: formattedOrder.partner?.currency || "$",
          gst_no: formattedOrder.partner?.gst_no
        }, null, 2));
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
    onAfterPrint: () => console.log("Printed successfully!"),
  });

  useEffect(() => {
    if (!loading && order && printRef.current) {
      handlePrint();
    }
  }, [loading, order, handlePrint]);

  if (loading) return <div>Loading order details...</div>;
  if (error) return <div>{error}</div>;
  if (!order) return <div>Order not found</div>;

  const currency = order?.partner?.currency || "$";
  const gstPercentage = order?.partner?.gst_percentage || 0;

  // Calculate amounts
  const foodSubtotal = (order?.items ?? []).reduce(
    (sum: number, item: OrderItem) => sum + item.price * item.quantity,
    0
  );

  const chargesSubtotal = order?.extra_charges?.reduce(
    (
      sum: number,
      charge: {
        name: string;
        amount: number;
        charge_type?: string;
        id?: string;
      }
    ) =>
      sum +
      getExtraCharge(
        order?.items || [],
        charge.amount || 0,
        charge.charge_type as QrGroup["charge_type"]
      ),
    0
  );

  const subtotal = foodSubtotal + chargesSubtotal;
  const gstAmount = (foodSubtotal * gstPercentage) / 100;
  const grandTotal = subtotal + gstAmount;

  const getOrderTypeText = () => {
    if (order.tableNumber === 0 || order.type === "delivery") return "Delivery";
    if (!order.tableNumber) return "Takeaway";
    return `Table ${order.tableNumber}`;
  };

  return (
    <div className="p-4">
      <div ref={printRef} id="printable-content" className="bill-template " style={{ 
        fontFamily: "monospace", 
        maxWidth: "300px",  
        maxHeight: "280mm",
        margin: "0 auto",
        padding: "16px",
        backgroundColor: "white"
      }}>
        {/* Header */}
        <h2 className="text-xl font-bold text-center uppercase">
          {order?.partner?.store_name || "Restaurant"}
        </h2>
        <p className="text-center text-xs mb-2">
          {[order?.partner?.district].filter(Boolean).join(", ") || ""}
        </p>
        <p className="text-center text-xs mb-2">
          {order?.partner?.phone ? `Tel: ${order?.partner.phone}` : ""}
        </p>
        <div className="border-b border-black my-2"></div>

        {/* Order Info */}
        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
          <div className=" gap-2">
            <span className="font-medium">Order #:</span>
            <span> {order.id.slice(0, 8)}</span>
          </div>
          <div className="text-right">
            <span className="font-medium">Date:</span>
            <span>
              {" "}
              {new Date(order.created_at).toLocaleDateString("en-GB")}
            </span>
          </div>
          <div>
            <span className="font-medium">Type:</span>
            <span> {getOrderTypeText()}</span>
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

        {/* Delivery Information */}
        {(order.tableNumber === 0 ||
          order.deliveryAddress !== "" ||
          order.type == "delivery") && (
          <>
            <div className="border-t border-black my-2"></div>
            <div className="text-sm">
              <div className="font-bold text-sm uppercase mb-1">
                Order Details:
              </div>
              {order.deliveryAddress !== "" && (
                <div className="mb-1 flex gap-2">
                  <div className="font-medium">Address:</div>
                  <div className="text-xs">{order.deliveryAddress}</div>
                </div>
              )}
              {!order.tableNumber && order.delivery_location && (
                <>
                  <div className="text-sm flex gap-2">
                    <div className="font-medium">Delivery Location:</div>
                    <br />
                    <div className="text-xs">
                      <img
                        alt="QR Code for Delivery Location"
                        className="w-16 h-16"
                        src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
                          `https://www.google.com/maps/place/${order.delivery_location?.coordinates[1]},${order.delivery_location?.coordinates[0]}`
                        )}`}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Takeaway Phone */}
        {order.phone && (
          <>
            <div className="text-sm flex gap-2">
              <div className="font-medium">Customer Phone:</div>
              <div className="text-xs">{order.phone}</div>
            </div>
          </>
        )}

        <div className="border-b border-black my-2"></div>

        {/* Order Items */}
        <h3 className="font-bold text-sm uppercase mb-1">Items Ordered</h3>
        <ul className="space-y-1 text-sm">
          {(order?.items ?? []).map((item: OrderItem) => (
            <li key={item.id} className="flex justify-between">
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>
                {currency}
                {(item.price * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        {/* Extra Charges */}
        {order?.extra_charges?.length > 0 && (
          <>
            <div className="border-t border-dashed border-gray-400 my-2"></div>
            <h3 className="font-bold text-sm uppercase mb-1">
              Extra Charges
            </h3>
            <ul className="space-y-1 text-sm">
              {order?.extra_charges?.map(
                (charge: {
                  id: string;
                  name: string;
                  amount: number;
                  charge_type?: string;
                }) => (
                  <li key={charge.id} className="flex justify-between">
                    <span>{charge.name}</span>
                    <span>
                      {currency}
                      {getExtraCharge(
                        order?.items || [],
                        charge.amount || 0,
                        charge.charge_type as QrGroup["charge_type"]
                      ).toFixed(2)}
                    </span>
                  </li>
                )
              )}
            </ul>
          </>
        )}

        {/* Totals */}
        <div className="border-t border-black my-2"></div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>
              {currency}
              {subtotal.toFixed(2)}
            </span>
          </div>
          {gstPercentage > 0 && (
            <div className="flex justify-between">
              <span>GST ({gstPercentage}%):</span>
              <span>
                {currency}
                {gstAmount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base mt-2 border-t border-black pt-1">
            <span>TOTAL:</span>
            <span>
              {currency}
              {grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs mt-4 pt-2 border-t border-dashed border-gray-400">
          <p>Thank you for your visit!</p>
          <p className="mt-1">
            {order?.partner?.gst_no ? `GSTIN: ${order?.partner.gst_no}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrintOrderPage;