/*...........query...........*/

export const getPartnerAndOffersQuery = `
query GetPartnerAndOffersQuery {
  partners(where: {id: {_eq: "0f61a766-73fb-40ba-83b8-bbe5ca2342cf"}}) {
    district
    menus(limit: 10) {
      category {
        name
      }
      description
      id
      image_url
      is_top
      name
      price
    }
    offers(limit: 10, where: {end_time: {_gt: "2025-03-01T00:00:00+00:00"}}) {
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