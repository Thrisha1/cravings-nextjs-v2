export const GetPaginatedPurchasesQuery = `
query GetPaginatedPurchases($partnerId: uuid!, $limit: Int!, $offset: Int!) {
  purchases(
    where: { partner_id: { _eq: $partnerId } },
    order_by: { purchase_date: desc },
    limit: $limit,
    offset: $offset
  ) {
    id
    created_at
    purchase_date
    total_price
    supplier {
      address
      id
      name
      phone
    }
    purchase_transactions {
      id
      total_price
      unit_price
      quantity
      purchase_item {
        category
        id
        name
      }
    }
  }
}
`;

export const GetMonthlyTotalQuery = `
query GetMonthlyTotal($partnerId: uuid!, $startDate: timestamptz!, $endDate: timestamptz!) {
  purchases_aggregate(
    where: {
      partner_id: { _eq: $partnerId },
      purchase_date: { _gte: $startDate, _lte: $endDate }
    }
  ) {
    aggregate {
      sum {
        total_price
      }
    }
  }
}
`;

export const createNewSupplierQuery = `
mutation CreateNewSupplier($name: String!, $phone: String!, $address: String!, $partner_id: uuid!) {
  insert_suppliers(objects: { name: $name, phone: $phone, address: $address, partner_id: $partner_id , created_at: now() }) {
    returning {
      id
      name
      phone
      address
    }
  }
}
`;


export const createNewPurchaseItemQuery = `
mutation CreateNewPurchaseItem($name: String!, $category: String!, $unit_price: Float!, $partner_id: uuid! , supplier_id: uuid!) {
  insert_purchase_items(objects: { name: $name, category: $category, unit_price: $unit_price, partner_id: $partner_id, created_at: now(), supplier_id: supplier_id }) {
    returning {
      id
      name
      category
      unit_price
    }
  }
}
`;