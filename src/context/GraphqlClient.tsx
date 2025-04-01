import React, { ReactNode } from 'react';
import { gql, GraphQLClient, ClientError } from 'graphql-request';

interface GraphQLContextType {
  (query: string, variables?: Record<string, unknown>): Promise<any>;
}

const GraphqlClientContext = React.createContext<GraphQLContextType>(() => {
  throw new Error('useGraphQL must be used within a GraphqlClientProvider');
});

interface GraphqlClientProviderProps {
  children: ReactNode;
}

const GraphqlClientProvider: React.FC<GraphqlClientProviderProps> = ({ children }) => {
  const graphQLEndpoint = process.env.HASURA_GRAPHQL_ENDPOINT as string;

  const graphqlFetch = async (query: string, variables?: Record<string, unknown>) => {
    try {
      const client = new GraphQLClient(graphQLEndpoint, {
        headers: {
          'x-hasura-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET as string,
        },
      });

      const data = await client.request(
        gql`
          ${query}
        `,
        variables
      );

      return data;
    } catch (err) {
      console.error('GraphQL Error:', err);
      
      const error = err as ClientError;
      if (error?.response?.errors?.[0]?.extensions?.code) {
        const errorCode = error.response.errors[0].extensions.code;
        if (errorCode === 'invalid-jwt') {
          // Handle JWT errors specifically
          throw new Error('Authentication failed. Please login again.');
        }
      }
      
      throw new Error('An error occurred while fetching data');
    }
  };

  return (
    <GraphqlClientContext.Provider value={graphqlFetch}>
      {children}
    </GraphqlClientContext.Provider>
  );
};

const useGraphQL = (): GraphQLContextType => {
  const context = React.useContext(GraphqlClientContext);
  if (!context) {
    throw new Error('useGraphQL must be used within a GraphqlClientProvider');
  }
  return context;
};

export { GraphqlClientProvider, useGraphQL, gql };