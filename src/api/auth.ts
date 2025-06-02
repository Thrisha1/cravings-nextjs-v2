/*...........query...........*/

export const userLoginQuery = `
  query GetUserByEmail($email: String!) {
  users(where: {email: {_eq: $email}}, limit: 1) {
    id
    email
    full_name
    phone
    crave_coins
    location
  }
}`;

// partner table data query
export const partnerQuery = `
  query GetPartnerByEmail($email: String!) {
  partners(where: {email: {_eq: $email}}, limit: 1) {
    id
  }
}`;

export const partnerIdQuery = `
  query GetPartnerById($id: uuid!) {
    partners_by_pk(id: $id) {
      id
      name
      email
      password
      store_name
      store_banner
      whatsapp_numbers
      footnote
      location
      status
      social_links
      upi_id
      feature_flags
      description
      phone
      district
      theme
      is_shop_open
      currency
      place_id
      gst_no
      gst_percentage
      business_type
      geo_location
      delivery_rate
      delivery_rules
    }
  }
`;

export const partnerLoginQuery = `
  query PartnerLogin($email: String!, $password: String!) {
    partners(where: {
      email: {_eq: $email}, 
      password: {_eq: $password}
    }, limit: 1) {
      id
      name
      email
      password
      store_name
      store_banner
      whatsapp_numbers
      footnote
      location
      status
      social_links
      upi_id
      feature_flags
      description
      phone
      district
      theme
      is_shop_open
      currency
      place_id
      gst_no
      gst_percentage
      geo_location
      delivery_rate
      delivery_rules
    }
  }
`;

export const superAdminLoginQuery = `
  query SuperAdminLogin($email: String!, $password: String!) {
    super_admin(where: {email: {_eq: $email}, password: {_eq: $password}}) {
      id
      email
    }
  }
`;

export const superAdminIdQuery = `
  query GetSuperAdminById($id: uuid!) {
    super_admin_by_pk(id: $id) {
      id
      email
    }
  }
`;

export const getUserByIdQuery = `
  query GetUserById($id: uuid!) {
    users_by_pk(id: $id) {
      id
      email
      full_name
      phone
      crave_coins
      location
    }
  }
`;

/*...........mutation...........*/

export const userLoginMutation = `
  mutation InsertUser($object: users_insert_input!) {
  insert_users_one(object: $object) {
    id
    email
    full_name
    phone
    crave_coins
    location
  }
}`;

export const partnerMutation = `
  mutation InsertPartner($object: partners_insert_input!) {
  insert_partners_one(object: $object) {
    id
    name
    email
    password
    whatsapp_numbers
    store_name
    status
    upi_id
    description
    phone
    district
    country
    state
  }
}`;

export const deleteUserMutation = `
  mutation DeleteUser($id: uuid!) {
    delete_users_by_pk(id: $id) {
      id
      email
      full_name
    }
  }
`;
