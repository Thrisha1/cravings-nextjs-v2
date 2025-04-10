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