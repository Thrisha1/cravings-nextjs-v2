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

export const updatePartnerStatusMutation = `
  mutation UpdatePartnerStatus($id: uuid!, $status: String!) {
    update_partners_by_pk(pk_columns: { id: $id }, _set: { status: $status }) {
      id
      status
    }
  }
`;

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