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
                store_name
            }
        }
    `, { partnerId });

    console.log('Partner response:', partnerResponse);

    const linkedAccountId = partnerResponse?.partners_by_pk?.razorpay_linked_account_id;

    if (!linkedAccountId) {
        console.warn('Partner does not have a linked account, creating order without transfers');
    }

    // Base options for order creation
    const baseOptions = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderId,
        payment_capture: 1, // Auto capture payment
    };

    // Add transfers only if linked account exists
    const options = linkedAccountId ? {
        ...baseOptions,
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
    } : baseOptions;

    try {
        console.log('Creating Razorpay order with options:', options);
        const order = await razorpay.orders.create(options);
        console.log('Razorpay order created:', order);

        return {
            orderId: order.id,
            amount: amountInPaise,
            key: process.env.RAZORPAY_KEY ?? '',
        }
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        throw new Error(`Failed to create payment order: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

        // Fetch payment details from Razorpay
        const payment = await razorpay.payments.fetch(obj.razorpay_payment_id);
        console.log('Payment details from Razorpay:', payment);

        if (payment.status !== 'captured') {
            console.error('Payment not captured, status:', payment.status);
            return false;
        }

        // Get the original order ID from Razorpay order receipt
        const razorpayOrder = await razorpay.orders.fetch(razorpayOrderId);
        const originalOrderId = razorpayOrder.receipt;
        
        console.log('Original order ID from receipt:', originalOrderId);

        // Find order in database using the original order ID
        const order = await fetchFromHasura(`
            query GetOrderById($orderId: uuid!) {
                orders_by_pk(id: $orderId) {
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
        `, { orderId: originalOrderId });

        console.log('Order from database:', order);

        if (!order?.orders_by_pk) {
            console.error('Order not found in database');
            return false;
        }

        const orderData = order.orders_by_pk;
        
        if (orderData.payment_status === 'completed') {
            console.log('Payment already completed');
            return true;
        }

        // Update order with payment details and payment status only
        const updateResponse = await fetchFromHasura(`
            mutation UpdateOrderWithPaymentDetails($orderId: uuid!, $paymentDetails: jsonb!) {
                update_orders_by_pk(
                    pk_columns: {id: $orderId}
                    _set: {
                        payment_status: "completed",
                        payment_details: $paymentDetails
                    }
                ) {
                    id
                    status
                    payment_status
                    payment_details
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
        `, { 
            orderId: orderData.id,
            paymentDetails: payment
        });

        console.log('Order updated with payment details:', updateResponse);

        return true;
    } catch (error) {
        console.error('Payment verification error:', error);
        return false;
    }
} 