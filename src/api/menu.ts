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
        }
    }
}`;
