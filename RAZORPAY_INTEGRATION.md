# Razorpay Payment Integration

This project integrates Razorpay payment gateway following the official Node.js integration guidelines.

## Environment Variables Required

Add these to your `.env.local` file:

```bash
RAZORPAY_KEY=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_secret_key
```

## Features Implemented

1. **Order Creation**: Creates Razorpay orders with proper amount conversion (paise)
2. **Payment Processing**: Handles payment through Razorpay checkout modal
3. **Signature Verification**: Verifies payment authenticity using HMAC-SHA256
4. **Split Payments**: Supports transfers to partner linked accounts (if configured)
5. **Fallback Support**: Works even if partners don't have linked accounts
6. **Error Handling**: Comprehensive error handling for failed/cancelled payments
7. **Status Updates**: Updates order status in database based on payment outcome
8. **Payment Details Storage**: Saves complete payment information in `payment_details` field

## How It Works

1. When user clicks "Pay & Place Order", the system:
   - Creates order in database with 'pending' status
   - Creates Razorpay order with original order ID as receipt
   - Opens Razorpay checkout modal

2. On successful payment:
   - Fetches Razorpay order to get original order ID from receipt
   - Verifies payment signature
   - Updates order status to 'completed'
   - Saves complete payment details in `payment_details` JSONB field
   - Clears cart and shows success message
   - Sends notifications to partner

3. On payment failure/cancellation:
   - Updates order status to 'failed' or 'cancelled'
   - Shows appropriate error message
   - Keeps cart intact for retry

## Files Modified

- `src/store/orderStore.ts` - Added payment flow to placeOrder function
- `src/screens/HotelMenuPage_v2.tsx` - Added Razorpay script loading
- `src/components/hotelDetail/placeOrder/PlaceOrderModal.tsx` - Updated button text
- `src/types/razorpay.d.ts` - TypeScript definitions
- `src/app/actions/razorpay.ts` - Server-side payment functions
- `src/api/orders.ts` - Added payment_details field to queries

## Database Requirements

Partners table should have:
- `razorpay_linked_account_id` field (optional) for split payments

Orders table should have:
- `payment_status` field to track payment status
- `payment_details` field (JSONB) to store complete payment information
- `notes` field remains available for restaurant-to-user communication

## Order Tracking

- Original order UUID is used as Razorpay order receipt
- Payment verification fetches Razorpay order to get original order ID
- No technical data stored in notes field (preserved for user communication)
- Complete payment details stored in `payment_details` JSONB field

## Testing

1. Set up test Razorpay keys in environment
2. Use test card numbers from Razorpay documentation
3. Test both successful and failed payment scenarios
4. Verify order status updates correctly
5. Check payment_details field contains complete payment information

## Production Checklist

- [ ] Replace test keys with live Razorpay keys
- [ ] Set up partner linked accounts for split payments
- [ ] Test with real payment methods
- [ ] Monitor payment webhooks (if implemented)
- [ ] Set up proper error monitoring
- [ ] Verify payment_details field contains expected data structure 