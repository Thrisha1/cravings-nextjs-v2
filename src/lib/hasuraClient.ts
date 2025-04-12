import { GraphQLClient } from "graphql-request";

const client = new GraphQLClient(
  "https://curious-ferret-93.hasura.app/v1/graphql" as string,
  {
    headers: {
      "x-hasura-admin-secret":
        "grK3WUtZW9mXGtYtjEqU44QfmFkWOMga9qQoa1uBvR03n7DXLkTodHH9cWDcN6cn" as string,
    },
  }
);
// const client = new GraphQLClient(process.env.HASURA_GRAPHQL_ENDPOINT as string, {
//   headers: {
//     'x-hasura-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET as string,
//   },
// });

// HASURA_GRAPHQL_ENDPOINT=https://curious-ferret-93.hasura.app/v1/graphql
// HASURA_GRAPHQL_ADMIN_SECRET=grK3WUtZW9mXGtYtjEqU44QfmFkWOMga9qQoa1uBvR03n7DXLkTodHH9cWDcN6cn

export function fetchFromHasura(
  query: string,
  variables?: Record<string, unknown>
): Promise<any> {
  return client.request(query, variables)
    .then((result) => {
      console.log("Result from Hasura: ", result);
      return result;
    })
    .catch((error: any) => {
      if (error.response?.errors) {
        error.response.errors.forEach((err: any) => {
          console.error("GraphQL Error:", err.message);
        });
      } else {
        console.error("Hasura Error:", JSON.stringify(error, null, 2));
      }

      // Optionally re-throw if you want to handle it outside
      throw error;
    });
}
