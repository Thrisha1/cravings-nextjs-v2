/*...........query...........*/

export const getPartnerCategories = `
    query PartnerCategoryQuerying($partner_id: uuid!) {
        category(where: {partner_id: {_eq: $partner_id}} , limit: 100) {
            id
            name
        }
    }
`;

/*...........mutation...........*/

export const addCategory = `
    mutation CategoryCreation($category: category_insert_input!) {
        insert_category(objects: $category) {
            returning {
                name
                id
            }
        }
    }
`;
