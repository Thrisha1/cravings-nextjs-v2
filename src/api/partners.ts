/*...........query...........*/

export const getAllPartnersQuery = `
query GetAllPartners($limit: Int, $offset: Int) {
  partners(limit: $limit, offset: $offset , where: {status: {_eq: "active"}}) {
    id 
    store_name
    location
    description
    district
    store_banner
  }
  partners_aggregate {
    aggregate {
      count
    }
  }
}`;


export const getPartnerByIdQuery = `
  query GetPartnerDsitricts() {
    partners {
      district
    }
  }
  `; 

export const getPartnerAndOffersQuery = `
query GetPartnerAndOffersQuery($id: uuid!) {
  partners(where: {id: {_eq: $id}}) {
    district
    location
    delivery_status
    id
    description
    feature_flags
    phone
    whatsapp_numbers
    store_banner
    social_links
    footnote
    status
    store_name
    is_shop_open
    currency
    place_id
    theme
    gst_no
    gst_percentage
    business_type
    menus(where: {deletion_status: {_eq: 0}}) {
      category {
        name
        id
        priority
      }
      priority
      description
      id
      image_url
      is_top
      is_available
      name
      price
      offers(where: {_and: [{end_time: {_gt: "now()"}}, {deletion_status: {_eq: 0}}]}) {
        offer_price
      }
      stocks{
        stock_quantity
        stock_type
        show_stock
      }
    }
    offers(where: {_and: [{end_time: {_gt: "now()"}}, {deletion_status: {_eq: 0}}]}) {
      end_time
      enquiries
      id
      menu {
        image_url
        description
        name
        id
        price
      }
      offer_price
      start_time
    }
  }
}
`;

export const getInactivePartnersQuery = `
  query GetInactivePartners {
    partners(where: { status: { _eq: "inactive" } }) {
      id
      name
      email
      store_name
      location
      status
      upi_id
      description
      phone
      district
    }
  }
`;

export const getAllPartnerUpiIdsQuery = `
  query GetAllPartnerUpiIds {
    partners {
      id
      upi_id
      store_name
    }
  }
`;

/*...........mutation...........*/

export const updatePartnerMutation = `
  mutation UpdatePartner(
    $id: uuid!
    $updates: partners_set_input!
  ) {
    update_partners_by_pk(
      pk_columns: { id: $id }
      _set: $updates
    ) {
      id
      status
      delivery_status
      upi_id
      store_banner
      place_id
      theme
      description
      currency
      feature_flags
      gst_no
      gst_percentage
      whatsapp_numbers
    }
  }
`;


/*...........types...........*/

export interface Partner {
  id: string;
  name: string;
  email: string;
  store_name: string;
  location: string;
  status: string;
  upi_id: string;
  description: string;
  phone?: string;
  district?: string;
}

export interface UpdatePartnerStatusResponse {
  update_partners_by_pk: {
    id: string;
    status: string;
  };
}