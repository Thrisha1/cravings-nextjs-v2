"use client";
import { useAuthStore } from '@/store/authStore';
import React, { useEffect, useState } from 'react';
import { getAuthCookie } from '../auth/actions';
import { subscribeToHasura } from '@/lib/hasuraSubscription';
import { OrderItem } from '@/store/orderStore';

const subscriptionQuery = `
subscription GetPartnerOrders($partner_id: uuid!) {
  orders(
    where: { partner_id: { _eq: $partner_id } }
    order_by: { created_at: desc }
  ) {
    id
    total_price
    created_at
    table_number
    qr_id
    type
    delivery_address
    status
    partner_id
    user_id
    user {
      full_name
      phone
      email
    }
    order_items {
      id
      quantity
      menu {
        id
        name
        price
        category {
          name
        }
      }
    }
  }
}
`;

const Page = () => {
  const [id, setId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');

  useEffect(() => {
    if (!id) return;

    console.log('Initializing subscription...');
    setConnectionStatus('Connecting...');

    const unsubscribe = subscribeToHasura({
      query: subscriptionQuery,
      variables: { partner_id: id },
      onNext: (data) => {
        console.log('New order data received:', data);
        if (data.data?.orders) {
          setOrders(prev => {
            const newOrders = data.data?.orders || [];
            const orderMap = new Map(prev.map(order => [order.id, order]));
            newOrders.forEach((order : OrderItem) => orderMap.set(order.id, order));
            return Array.from(orderMap.values());
          });
        }
      },
      onError: (error) => {
        console.error('Subscription error:', error);
        setConnectionStatus(`Error: ${error.message}`);
      },
      onComplete: () => {
        console.log('Subscription completed');
        setConnectionStatus('Completed');
      },
    });

    return () => {
      console.log('Cleaning up subscription...');
      unsubscribe();
    };
  }, [id]);

  useEffect(() => {
    const getUserId = async () => {
      const userId = (await getAuthCookie())?.id;
      setId(userId || "");
      console.log('User ID:', userId);
    }

    getUserId();
  }, []);

  return (
    <div>
      <h1>Orders</h1>
      <p>Connection status: {connectionStatus}</p>
      <p>Total orders: {orders.length}</p>
      <ul>
        {orders.map((order, index) => (
          <li key={index}>
            Order : {order.id} - {order.total_price} - {order.created_at} - {order.table_number} - {order.qr_id} - {order.type} - {order.delivery_address} - {order.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Page;