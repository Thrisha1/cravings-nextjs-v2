/*...........query...........*/

export const getPartnerAndOffersQuery = `
query GetPartnerAndOffersQuery($id: uuid! , $end_time: timestamptz!) @cached {
  partners(where: {id: {_eq: $id}}) {
    district
    location
    store_banner
    store_name
    menus {
      category {
        name
        id
      }
      description
      id
      image_url
      is_top
      name
      price
    }
    offers(where: {end_time: {_gt: $end_time}}) {
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

export const updateUpiIdMutation = `
  mutation UpdateUpiId($id: uuid!, $upi_id: String!) {
    update_partners_by_pk(pk_columns: { id: $id }, _set: { upi_id: $upi_id }) {
      id
      upi_id
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