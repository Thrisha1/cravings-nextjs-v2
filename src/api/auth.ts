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
    name
    email
    password
    store_name
    location
    status
    upi_id
    description
    phone
    district
  }
}`;


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
    store_name
    location
    status
    upi_id
    description
    phone
    district
  }
}`;