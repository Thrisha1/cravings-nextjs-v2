export const uploadCommonOffer = `
mutation InsertCommonOffer(
  $partner_name: String!
  $item_name: String!
  $price: Int!
  $location: String
  $description: String
  $insta_link: String
  $image_url: String
  $likes: Int
  $district: String!
) {
  insert_common_offers_one(
    object: {
      partner_name: $partner_name
      item_name: $item_name
      price: $price
      location: $location
      description: $description
      insta_link: $insta_link
      image_url: $image_url
      likes: $likes
      district: $district
      created_at: "now()"
    }
  ) {
    id
    partner_name
    item_name
    likes
    price
    location
    description
    insta_link
    image_url
    district
    created_at
  }
}`;