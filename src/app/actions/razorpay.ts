'use server';

import Razorpay from "razorpay";
import { fetchFromHasura } from "@/lib/hasuraClient";
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY ?? '',
    key_secret: process.env.RAZORPAY_SECRET ?? '', 
});

export type RazorpayResponseType = {
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string,
};

export async function createRazorpayOrder(orderId: string, amount: number, partnerId: string) {
    // Convert amount to paise and ensure it's an integer
    const amountInPaise = Math.round(amount * 100);

    // Get partner's linked account ID from Hasura
    const partnerResponse = await fetchFromHasura(`
        query GetPartnerLinkedAccount($partnerId: uuid!) {
            partners_by_pk(id: $partnerId) {
                razorpay_linked_account_id
            }
        }
    `, { partnerId });

    console.log('Partner response:', partnerResponse);

    if (!partnerResponse?.partners_by_pk?.razorpay_linked_account_id) {
        throw new Error('Partner linked account not found');
    }

    const linkedAccountId = partnerResponse.partners_by_pk.razorpay_linked_account_id;

    const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderId,
        payment_capture: 1, // Auto capture payment
        transfers: [
            {
                account: linkedAccountId,
                amount: amountInPaise,
                currency: 'INR',
                notes: {
                    order_id: orderId,
                    partner_id: partnerId
                }
            }
        ]
    }

    try {
        console.log('Creating Razorpay order with options:', options);
        const order = await razorpay.orders.create(options);
        console.log('Razorpay order created:', order);

        // Update order with Razorpay order ID in notes field
        const updateResponse = await fetchFromHasura(`
            mutation UpdateOrderWithRazorpayId($orderId: uuid!, $razorpayOrderId: String!) {
                update_orders_by_pk(
                    pk_columns: {id: $orderId}
                    _set: {notes: $razorpayOrderId}
                ) {
                    id
                    notes
                }
            }
        `, {
            orderId,
            razorpayOrderId: order.id
        });

        console.log('Order updated with Razorpay ID:', updateResponse);

        return {
            orderId: order.id,
            amount: amountInPaise,
            key: process.env.RAZORPAY_KEY ?? '',
        }
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw new Error('Failed to create payment order');
    }
}

export async function verifyPayment(razorpayOrderId: string, obj: RazorpayResponseType) {
    try {
        console.log('Verifying payment for Razorpay order:', razorpayOrderId);
        console.log('Payment response:', obj);

        // Verify signature
        const body = obj.razorpay_order_id + "|" + obj.razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_SECRET ?? '')
            .update(body.toString())
            .digest("hex");

        const isValidSignature = expectedSignature === obj.razorpay_signature;
        console.log('Signature verification:', {
            expected: expectedSignature,
            received: obj.razorpay_signature,
            isValid: isValidSignature
        });

        if (!isValidSignature) {
            console.error('Invalid signature');
            return false;
        }

        // Verify payment with Razorpay
        const payment = await razorpay.payments.fetch(obj.razorpay_payment_id);
        console.log('Payment details from Razorpay:', payment);

        if (payment.status !== 'captured') {
            console.error('Payment not captured, status:', payment.status);
            return false;
        }

        // Find and update the order in Hasura
        const order = await fetchFromHasura(`
            query GetOrderByRazorpayId($razorpayOrderId: String!) {
                orders(where: {notes: {_eq: $razorpayOrderId}}) {
                    id
                    status
                    payment_status
                    order_items {
                        id
                        quantity
                        menu {
                            id
                            name
                            price
                        }
                    }
                }
            }
        `, { razorpayOrderId });

        console.log('Order from database:', order);

        if (!order?.orders?.[0]) {
            console.error('Order not found in database');
            return false;
        }

        const orderData = order.orders[0];
        
        if (orderData.status === 'completed') {
            console.log('Order already completed');
            return true;
        }

        // Update order status and payment status to completed
        const updateResponse = await fetchFromHasura(`
            mutation UpdateOrderStatus($orderId: uuid!) {
                update_orders_by_pk(
                    pk_columns: {id: $orderId}
                    _set: {
                        status: "completed",
                        payment_status: "completed"
                    }
                ) {
                    id
                    status
                    payment_status
                    order_items {
                        id
                        quantity
                        menu {
                            id
                            name
                            price
                        }
                    }
                }
            }
        `, { orderId: orderData.id });

        console.log('Order status updated:', updateResponse);

        return true;
    } catch (error) {
        console.error('Payment verification error:', error);
        return false;
    }
} 