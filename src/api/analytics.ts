// API queries for analytics dashboard

export const getOrderStatusMetrics = `
  query GetOrderStatus($startDate: timestamptz, $endDate: timestamptz) {
    cancelled: orders_aggregate(where: {
      status: {_eq: "cancelled"},
      created_at: {_gte: $startDate, _lte: $endDate}
    }) {
      aggregate {
        count
      }
    }
    completed: orders_aggregate(where: {
      status: {_eq: "completed"},
      created_at: {_gte: $startDate, _lte: $endDate}
    }) {
      aggregate {
        count
      }
    }
    pending: orders_aggregate(where: {
      status: {_eq: "pending"},
      created_at: {_gte: $startDate, _lte: $endDate}
    }) {
      aggregate {
        count
      }
    }
    total: orders_aggregate(where: {
      created_at: {_gte: $startDate, _lte: $endDate}
    }) {
      aggregate {
        count
        sum {
          total_price
        }
      }
    }
  }
`;

// Query to get top QR codes by scan count
export const getTopQRCodes = `
  query GetTopQRCodes($limit: Int = 10, $offset: Int = 0, $search: String = "") {
    qr_codes(
      where: {
        partner: {
          name: { _ilike: $search }
        }
      }
      order_by: { no_of_scans: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      no_of_scans
      partner_id
      table_number
      partner {
        name
        phone
      }
    }
    qr_codes_aggregate(
      where: {
        partner: {
          name: { _ilike: $search }
        }
      }
    ) {
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
  query GetPartnerMetrics($startDate: timestamptz, $endDate: timestamptz) {
    total_partners: partners_aggregate(
      where: { created_at: { _gte: $startDate, _lte: $endDate } }
    ) {
      aggregate {
        count
      }
    }
    active_partners: partners_aggregate(
      where: { 
        _exists: { menu: true },
        created_at: { _gte: $startDate, _lte: $endDate }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// Query to get user metrics
export const getUserMetrics = `
  query GetUserMetrics($startDate: timestamptz, $endDate: timestamptz) {
    total_users: users_aggregate(
      where: { created_at: { _gte: $startDate, _lte: $endDate } }
    ) {
      aggregate {
        count
      }
    }
    active_users: users_aggregate(
      where: { 
        _exists: { orders: true },
        created_at: { _gte: $startDate, _lte: $endDate }
      }
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
          no_of_scans
        }
      }
    }
  }
`; 