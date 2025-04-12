

export const addMenu = `
    mutation InsertMenu($menu: [menu_insert_input!]!) {
    insert_menu(objects: $menu) {
        returning {
        id
        name
        category_id
        image_url
        image_source
        partner_id
        price
        }
    }
}`;
