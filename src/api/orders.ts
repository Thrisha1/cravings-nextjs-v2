export const createOrderMutation = `
                  mutation CreateOrder(
                    $totalPrice: float8!,
                    $createdAt: timestamptz!,
                    $tableNumber: Int,
                    $qrId: uuid,
                    $partnerId: uuid!,
                    $userId: uuid!
                  ) {
                    insert_orders_one(object: {
                      total_price: $totalPrice
                      created_at: $createdAt
                      table_number: $tableNumber
                      qr_id: $qrId
                      partner_id: $partnerId
                      user_id: $userId
                      status: "pending"
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
