import { GraphQLClient } from "graphql-request";

export const client = new GraphQLClient(
  process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT as string,
  {
    headers: {
      "x-hasura-admin-secret":
        process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ADMIN_SECRET as string,
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
  // Log the query and variables before making the request
  console.log("[HasuraClient] Making GraphQL request:");
  
  // Get the operation name or type from the query (simple regex extraction)
  const operationMatch = query.match(/mutation\s+(\w+)|query\s+(\w+)/);
  const operationName = operationMatch 
    ? (operationMatch[1] || operationMatch[2] || 'Unknown') 
    : 'Unknown';
    
  // Show first 100 chars of query to avoid too much console output
  console.log(`[HasuraClient] Operation: ${operationName}`);
  console.log(`[HasuraClient] Query (truncated): ${query.substring(0, 200)}...`);
  console.log("[HasuraClient] Variables:", variables);
  
  const startTime = performance.now();
  
  return client.request(query, variables)
    .then((result) => {
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      
      console.log(`[HasuraClient] Response received in ${duration}ms for operation: ${operationName}`);
      
      // Log a preview of the result to avoid flooding the console
      const resultPreview = JSON.stringify(result).substring(0, 200) + "...";
      console.log(`[HasuraClient] Response preview: ${resultPreview}`);
      
      return result;
    })
    .catch((error: any) => {
      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(2);
      
      console.error(`[HasuraClient] Error after ${duration}ms for operation: ${operationName}`);
      console.error("[HasuraClient] Error details:", error);
      
      // If there are GraphQL specific errors, log them in a more readable format
      if (error.response && error.response.errors) {
        console.error("[HasuraClient] GraphQL errors:", error.response.errors);
      }
      
      throw error;
    });
}
