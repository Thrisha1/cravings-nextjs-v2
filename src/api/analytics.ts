// API queries for analytics dashboard

export const getOrderStatusMetrics = `
  query GetOrderStatus {
    cancelled: orders_aggregate(where: {status: {_eq: "cancelled"}}) {
      aggregate {
        count
      }
    }
    completed: orders_aggregate(where: {status: {_eq: "completed"}}) {
      aggregate {
        count
      }
    }
    pending: orders_aggregate(where: {status: {_eq: "pending"}}) {
      aggregate {
        count
      }
    }
  }
`;

// Query to get orders by day for time series analysis
export const getOrdersByDay = `
  query GetOrdersByDay($startDate: timestamptz!, $endDate: timestamptz!) {
    orders(
      where: { created_at: { _gte: $startDate, _lte: $endDate } }
      order_by: { created_at: asc }
    ) {
      created_at
      status
      total_price
    }
  }
`;

// Query to get partners count metrics
export const getPartnerMetrics = `
  query GetPartnerMetrics {
    total_partners: partners_aggregate {
      aggregate {
        count
      }
    }
    active_partners: partners_aggregate(
      where: { _exists: { menu: true } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// Query to get user metrics
export const getUserMetrics = `
  query GetUserMetrics {
    total_users: users_aggregate {
      aggregate {
        count
      }
    }
    active_users: users_aggregate(
      where: { _exists: { orders: true } }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// Query to get QR scan metrics
export const getQRScanMetrics = `
  query GetQRScanMetrics {
    total_scans: qr_codes_aggregate {
      aggregate {
        sum {
          scan_count
        }
      }
    }
  }
`; 