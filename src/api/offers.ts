/*...........query...........*/

export const getOfferById = `
  query GetOfferById($id: uuid!) @cached {
    offers(where: {id: {_eq: $id}}) {
      created_at
      id
      offer_price
      end_time
      enquiries
      items_available
      start_time
      menu {
        category {
          name
        }
        description
        image_url
        name
        price
        id
      }
      partner {
        district
        store_name
        id
      }
    }
  }
`;


export const getOffers = `
  query GetOffers @cached {
    offers(limit: 6, order_by: {created_at: desc}) {
      created_at
      id
      offer_price
      end_time
      enquiries
      items_available
      start_time
      menu {
        category {
          name
        }
        description
        image_url
        name
        price
        id
      }
      partner {
        district
        store_name
        id
      }
    }
  }
`;

export const getPartnerOffers = `
  query GetPartnerOffers($partner_id: uuid!, $end_time: timestamptz!) @cached {
  offers(where: {partner_id: {_eq: $partner_id}, end_time: {_gt: $end_time}}) {
    created_at
    id
    offer_price
    end_time
    enquiries
    items_available
    start_time
    menu {
        category {
          name
        }
      description
      image_url
      name
      price
      id
    }
  }
}
`;

/*...........mutation...........*/

export const addOffer = `
mutation AddOffer($created_at: timestamptz!, $end_time: timestamptz!, $items_available: Int!, $menu_item_id: uuid!, $offer_price: Int!, $partner_id: uuid!, $start_time: timestamptz!) {
  insert_offers(objects: {
    created_at: $created_at,
    end_time: $end_time,
    items_available: $items_available,
    menu_item_id: $menu_item_id,
    offer_price: $offer_price,
    partner_id: $partner_id,
    start_time: $start_time
  }) {
    returning {
      created_at
      end_time
      enquiries
      id
      items_available
      offer_price
      start_time
      menu {
        category {
          name
        }
        description
        image_url
        id
        name
        price
      }
    }
  }
}
`;

export const deleteOffer = `
  mutation DeleteOffer($id: uuid!) {
    delete_offers(where: { id: { _eq: $id } }) {
      affected_rows
      returning {
        id
      }
    }
  }
`;
