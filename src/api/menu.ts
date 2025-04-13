/*...........query...........*/

export const getMenu = `
    query GetMenu($partner_id: uuid!) {
        menu(where: {partner_id: {_eq: $partner_id}} , limit: 100) {
            id
            name
            category { name }
            image_url
            image_source
            partner_id
            price
            description
            is_top
        }
    }
`;

export const getCategoryImages = `
  query GetMenuCategoryImages($partner_id: uuid!, $category: String!) {
    menu(
      where: {
        category: { name: { _eq: $category } },
        partner_id: { _eq: $partner_id },
        image_url: { _neq: "", _is_null: false }
      },
      distinct_on: [image_url], 
      limit: 100
    ) {
      image_url
      image_source
      name
    }
  }
`;

/*...........mutation...........*/

export const addMenu = `
    mutation InsertMenu($menu: [menu_insert_input!]!) {
    insert_menu(objects: $menu) {
        returning {
            id
            name
            category { name }
            image_url
            image_source
            partner_id
            price
            description
            is_top
        }
    }
}`;

export const updateMenu = `
    mutation UpdateMenu($id: uuid!, $menu: menu_set_input!) {
        update_menu(where: {id: {_eq: $id}}, _set: $menu) {
            returning {
                id
                name
                category { name }
                image_url
                image_source
                partner_id
                price
                description
                is_top
            }
        }
    }
`;

export const deleteMenu = `
    mutation DeleteMenu($id: uuid!) {
        delete_menu(where: {id: {_eq: $id}}) {
            returning {
                id
            }
        }
    }
`;
