/*...........query...........*/

// export const login = `
//     query queryAllUsers {
//         allUsers {
//             id
//             username
//             password
//         }
//     }
//     `;


/*...........mutation...........*/

export const loginMutation = `
  mutation insertUser ($loginInput: login_insert_input!){
    insert_login_one(object: $loginInput) {
        id   
    }
  }
`;