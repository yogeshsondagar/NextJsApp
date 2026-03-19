import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// 1. Create the connection link to Hasura
const httpLink = new HttpLink({
  // This is the default local endpoint for Hasura's GraphQL API
  uri: 'http://localhost:8080/v1/graphql',

  // 2. The Security Keys
  headers: {
    // Passing the admin secret directly in the frontend is strictly for LOCAL development.
    // In a real production app, we would pass the NextAuth JWT token here instead!
    'x-hasura-admin-secret': 'myadminsecretkey'
  }
});

// 3. Build and export the client
export const client = new ApolloClient({
  link: httpLink,
  // Apollo has a highly advanced caching system. 
  // InMemoryCache ensures we don't fetch the same data twice if we don't need to.
  cache: new InMemoryCache(),
});
