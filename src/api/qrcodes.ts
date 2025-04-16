export const GET_QR_TABLE = `
query GetQrTable($id: uuid!) {
  qr_codes(where: {id: {_eq: $id}}) {
    table_number,
    partner_id
  }
}`;

export const GET_QR_CODES_BY_PARTNER = `
  query GetQrCodesByPartner($partner_id: uuid!) {
    qr_codes(where: {partner_id: {_eq: $partner_id}}) {
      id
      qr_number
      table_number
      no_of_scans
    }
  }
`;

export const INSERT_QR_CODE = `
  mutation InsertQrCode($object: qr_codes_insert_input!) {
    insert_qr_codes_one(object: $object) {
      id
      qr_number
      table_number
      partner_id
      no_of_scans
    }
  }
`;

export const UPDATE_QR_CODE = `
  mutation UpdateQrCode($id: uuid!, $changes: qr_codes_set_input!) {
    update_qr_codes_by_pk(pk_columns: {id: $id}, _set: $changes) {
      id
      qr_number
      table_number
      no_of_scans
    }
  }
`;

export const DELETE_QR_CODE = `
  mutation DeleteQrCode($id: uuid!) {
    delete_qr_codes_by_pk(id: $id) {
      id
    }
  }
`;
