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
    store_banner
    store_name
    menus(where: {deletion_status: {_eq: 0}}) {
      category {
        name
        id
        priority
      }
      description
      id
      image_url
      is_top
      is_available
      name
      price
    }
    offers(where: {_and: [{end_time: {_gt: "now()"}}, {deletion_status: {_eq: 0}}]}) {
      end_time
      enquiries
      id
      menu {
        image_url
        description
        name
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

export const updatePartnerStatusMutation = `
  mutation UpdatePartnerStatus($id: uuid!, $status: String!) {
    update_partners_by_pk(pk_columns: { id: $id }, _set: { status: $status }) {
      id
      status
    }
  }
`;

export const updatePartnerDeliveryStatusMutation = `
  mutation UpdatePartnerDeliveryStatus($id: uuid!, $delivery_status: String!) {
    update_partners_by_pk(pk_columns: { id: $id }, _set: { delivery_status: $delivery_status }) {
      id
      delivery_status
    }
  }
`;

export const updateUpiIdMutation = `
  mutation UpdateUpiId($id: uuid!, $upi_id: String!) {
    update_partners_by_pk(pk_columns: { id: $id }, _set: { upi_id: $upi_id }) {
      id
      upi_id
    }
  }
`;

export const updateStoreBannerMutation = `
  mutation UpdateStoreBanner($userId: uuid!, $storeBanner: String!) {
    update_partners_by_pk(pk_columns: { id: $userId }, _set: { store_banner: $storeBanner }) {
      id
      store_banner
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