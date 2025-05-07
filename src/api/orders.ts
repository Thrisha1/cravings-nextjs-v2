export const createOrderMutation = `
                  mutation CreateOrder(
                    $id: uuid,
                    $totalPrice: float8!,
                    $createdAt: timestamptz!,
                    $tableNumber: Int,
                    $qrId: uuid,
                    $partnerId: uuid!,
                    $userId: uuid!,
                    $type: String!,
                    $delivery_address: String,
                  ) {
                    insert_orders_one(object: {
                      id: $id
                      total_price: $totalPrice
                      created_at: $createdAt
                      table_number: $tableNumber
                      qr_id: $qrId
                      partner_id: $partnerId
                      user_id: $userId
                      status: "pending"
                      type: $type
                      delivery_address: $delivery_address
                    }) {
                      id
                      total_price
                      created_at
                    }
                  }
`;

export const createOrderItemsMutation = `
                  mutation CreateOrderItems($orderItems: [order_items_insert_input!]!) {
                    insert_order_items(objects: $orderItems) {
                      affected_rows
                    }
                  }
`;


// subscription 


export const subscriptionQuery = `
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