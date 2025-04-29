"use client";
import { useAuthStore } from '@/store/authStore';
import useOrderStore from '@/store/orderStore';
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchFromHasura } from '@/lib/hasuraClient';

const OrdersTab = () => {
  const { userData } = useAuthStore();
  const { 
    fetchOrderOfPartner,
    fetchOrderItems 
  } = useOrderStore();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Fetch orders for this partner
  const loadOrders = async () => {
    if (!userData?.id) return;
    
    setLoading(true);
    try {
      const partnerOrders = await fetchOrderOfPartner(userData.id);
      if (partnerOrders) {
        setOrders(partnerOrders);
      }
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Fetch order items when expanding an order
  const loadOrderItems = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }

    setItemsLoading(true);
    try {
      const items = await fetchOrderItems(orderId);
      if (items) {
        setOrderItems(items);
        setExpandedOrder(orderId);
      }
    } catch (error) {
      toast.error("Failed to load order items");
    } finally {
      setItemsLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: 'completed' | 'cancelled') => {
    try {
      const response = await fetchFromHasura(
        `mutation UpdateOrderStatus($orderId: uuid!, $status: String!) {
          update_orders_by_pk(pk_columns: {id: $orderId}, _set: {status: $status}) {
            id
            status
          }
        }`,
        {
          orderId,
          status: newStatus
        }
      );

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      // Refresh orders after update
      await loadOrders();
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      toast.error(`Failed to update order status: `);
    }
  };

  React.useEffect(() => {
    loadOrders();
  }, [userData?.id]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Orders Management</h2>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-8 w-8" />
        </div>
      ) : (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-gray-500">No orders found</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Order #{order.id.slice(0, 8)}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => loadOrderItems(order.id)}
                    >
                      {expandedOrder === order.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="mt-2 flex justify-between">
                  <div>
                    <p className="text-sm">
                      Table: {order.table_number || 'N/A'}
                    </p>
                    <p className="text-sm">
                      Customer: {order.user?.full_name || 'Unknown'}
                    </p>
                  </div>
                  <p className="font-medium">
                    Total: ${order.total_price.toFixed(2)}
                  </p>
                </div>

                {expandedOrder === order.id && (
                  <div className="mt-4 border-t pt-4">
                    {itemsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin h-5 w-5" />
                      </div>
                    ) : (
                      <>
                        <h4 className="font-medium mb-2">Order Items</h4>
                        <div className="space-y-2">
                          {orderItems.length === 0 ? (
                            <p className="text-gray-500 text-sm">No items found</p>
                          ) : (
                            orderItems.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <div>
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-gray-500 ml-2">x{item.quantity}</span>
                                </div>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="mt-4 flex gap-2">
                          {order.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateOrderStatus(order.id, 'completed')}
                              >
                                Mark as Completed
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              >
                                Cancel Order
                              </Button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersTab;