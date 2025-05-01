/*...........query...........*/

export const getPartnerCategories = `
    query PartnerCategoryQuerying($partner_id: uuid!)  {
        category(where: {partner_id: {_eq: $partner_id}, deletion_status: {_eq: 0}} , limit: 100) {
            id
            name
        }
    }
`;

export const getCategory = `
    query GetCategory($name: String!, $partner_id: uuid!)  {
        category(where: {name: {_eq: $name}, partner_id: {_eq: $partner_id} ,deletion_status: {_eq: 0}} , limit: 1) {
            id
            name
        }
    }
`;

/*...........mutation...........*/

export const addCategory = `
    mutation CategoryCreation($category: [category_insert_input!]!) {
        insert_category(objects: $category) {
            returning {
                name
                id
            }
        }
    }
`;
