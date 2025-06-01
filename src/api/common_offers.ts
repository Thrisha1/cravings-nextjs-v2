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
  $coordinates: geography!
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
      coordinates: $coordinates
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
    coordinates
  }
}`;

export const getAllCommonOffers = (district : string | null , searchQuery : string | null) => {
  return  `
  query GetAllCommonOffers($limit: Int, $offset: Int, $district: String, $searchQuery: String) {
    common_offers: common_offers(
      order_by: {created_at: desc}, 
      limit: $limit, 
      offset: $offset,
      where: {
        ${district ? 'district: {_eq: $district}' : ''}
        ${district && searchQuery ? ',' : ''}
        ${searchQuery ? `_or: [
          {partner_name: {_ilike: $searchQuery}},
          {item_name: {_ilike: $searchQuery}}
        ]` : ''}
      }
    ) {
      id
      partner_name
      item_name
      price
      image_url
      district
      created_at
    }
    common_offers_aggregate: common_offers_aggregate(
      where: {
        ${district ? 'district: {_eq: $district}' : ''}
        ${district && searchQuery ? ',' : ''}
        ${searchQuery ? `_or: [
          {partner_name: {_ilike: $searchQuery}},
          {item_name: {_ilike: $searchQuery}}
        ]` : ''}
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;
}

export const getCommonOffersWithDistance = `
  query GetCommonOffersWithDistance(
    $userLat: Float!
    $userLon: Float!
    $limit: Int!
    $offset: Int!
  ) {
    common_offers(
      limit: $limit
      offset: $offset
      order_by: { created_at: desc }
    ) {
      id
      partner_name
      item_name
      price
      image_url
      district
      distance: offer_distance(
        coordinates,
        $userLat,
        $userLon
      ) / 1000 
    }
  }
`;

export const getAllCommonOffersAllFields = `
  query GetAllCommonOffers($limit: Int , $offset: Int) {
    common_offers(order_by: {created_at: desc} , limit: $limit, offset: $offset) {
      id
      partner_name
      item_name
      price
      location
      description
      insta_link
      likes
      image_url
      district
      created_at
    }
    common_offers_aggregate {
      aggregate {
        count
      }
    }
  }
`;

export const getCommonOfferById = `
  query GetCommonOfferById($id: uuid!) {
    common_offers_by_pk(id: $id) {
      id
      partner_name
      item_name
      price
      location
      description
      insta_link
      image_url
      likes
      district
      created_at
    }
  }
`;

export const deleteCommonOffer = `
  mutation DeleteCommonOffer($id: uuid!) {
    delete_common_offers_by_pk(id: $id) {
      id
    }
}`;


export const updateCommonOffer = `
  mutation UpdateCommonOffer( $object: common_offers_set_input!, $id: uuid!) {
    update_common_offers_by_pk(pk_columns: {id: $id}, _set: $object) {
      id
      partner_name
      item_name
      price
      location
      description
      insta_link
      image_url
      likes
      district
      created_at
      coordinates
    }
  }`;

  export const searchCommonOffers = `
  query SearchCommonOffers($searchTerm: String!, $limit: Int!, $offset: Int!) {
    common_offers(
      where: {
        _or: [
          { partner_name: { _ilike: $searchTerm } },
          { item_name: { _ilike: $searchTerm } },
          { location: { _ilike: $searchTerm } },
          { district: { _ilike: $searchTerm } },
          { description: { _ilike: $searchTerm } }
        ]
      },
      limit: $limit,
      offset: $offset,
      order_by: { created_at: desc }
    ) {
      id
      partner_name
      item_name
      price
      location
      description
      insta_link
      likes
      image_url
      district
      coordinates
      created_at
    }
  }
`;