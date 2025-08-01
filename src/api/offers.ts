/*...........query...........*/

export const getOfferById = `
  query GetOfferById($id: uuid!) {
    offers(where: {id: {_eq: $id}}) {
      created_at
      id
      offer_price
      end_time
      enquiries
      items_available
      start_time
      deletion_status
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
        location
        id
      }
    }
  }
`;
export const getOffers = `
  query GetOffers {
    offers(
      where: { deletion_status: { _eq: 0 } , end_time: { _gt: "now()" } , offer_price: { _is_null: false } , menu_item_id: { _is_null: false } },
      order_by: { created_at: desc }
    ) {
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
        location
        id
      }
    }
  }
`;

export const getPartnerOffers = `
  query GetPartnerOffers($partner_id: uuid!) {
  offers(where: {deletion_status: {_eq: 0 } ,partner_id: {_eq: $partner_id}, end_time: {_gt: "now()" }}) {
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
mutation AddOffer($offer: offers_insert_input!) {
  insert_offers(objects: [$offer]) {
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
mutation SoftDeleteOffer($id: uuid!) {
    update_offers(
      where: { id: { _eq: $id } },
      _set: { deletion_status: 1 }
    ){
      affected_rows 
    }
  }
`;

export const incrementOfferEnquiry = `
  mutation IncrementOfferEnquiry($id: uuid!) {
    update_offers(where: { id: { _eq: $id } }, _inc: { enquiries: 1 }) {
      affected_rows
      returning {
        id
        enquiries
      }
    }
  }`;
