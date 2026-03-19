// import NextAuth, { NextAuthOptions } from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";

// // 1. Define the NextAuth configuration
// const authOptions:NextAuthOptions = {
//     providers: [
//         CredentialsProvider({
//             name: "Credentials",
//             credentials: {
//                 username: { label: "Username", type: "text", placeholder: "admin" },
//                 password: { label: "Password", type: "password" }
//             },
//             // 2. The authorize function runs when a user hits "Submit" on the login form
//             async authorize(credentials) {
//                 // Let's create two mock users to test our roles!
//                 if (credentials?.username === "admin" && credentials?.password === "password") {
//                     return { id: "1", name: "Admin User", email: "admin@test.com", role: "admin" };
//                 }
//                 if (credentials?.username === "intern" && credentials?.password === "password") {
//                     return { id: "2", name: "Intern User", email: "intern@test.com", role: "intern" };
//                 }
//                 return null;
//             }
//         })
//     ],
//     // 1. We must explicitly define callbacks to pass the custom role property
//     callbacks: {
//         // This runs when the token is created on the server (during login)
//         async jwt({ token, user }) {
//             if (user) {
//                 token.role = user.role;
//             }
//             return token;
//         },
//         // This runs when the frontend requests the session
//         async session({ session, token }) {
//             if (session?.user) {
//                 session.user.role = token.role;
//             }
//             return session;
//         }
//     }
// };

// // 3. Create the handler
// const handler = NextAuth(authOptions);

// // 4. Export it for both GET and POST requests (required by Next.js App Router)
// export { handler as GET, handler as POST };


import bcrypt from 'bcryptjs';
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// 1. We write the GraphQL Query as a standard string
const GET_USER_QUERY = `
  query GetUser($username: String!) {
    users(where: {username: {_eq: $username}}) {
      id
      username
      password
      role
    }
  }
`;

const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "username" },
                password: { label: "Password", type: "password", placeholder: "********" }
            },
            async authorize(credentials) {
                // If they left the fields blank, reject immediately
                if (!credentials?.username || !credentials?.password) return null;

                try {
                    // 2. We use native fetch to send the query to Hasura because apollo uses csr and nextauth runs completely on backend that is nodejs/nextjs
                    const response = await fetch('http://localhost:8080/v1/graphql', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-hasura-admin-secret': 'myadminsecretkey' // Local dev password
                        },
                        body: JSON.stringify({
                            query: GET_USER_QUERY,
                            variables: { username: credentials.username } // Pass what they typed in the login box
                        })
                    });

                    const result = await response.json();

                    // 3. Extract the user from the Hasura JSON response
                    const user = result.data?.users?.[0];

                
                    // 4. Verify the user exists AND the password matches using bcrypt
                    const passwordsMatch = await bcrypt.compare(credentials.password, user.password);

                    if (user && passwordsMatch) {
                        // Return the user object to NextAuth! (This packs the suitcase)
                        return {
                            id: user.id,
                            name: user.username,
                            role: user.role
                        };
                    }

                    // If password fails or user doesn't exist, return null to show "Access Denied"
                    return null;

                } catch (error) {
                    console.error("Auth fetch error:", error);
                    return null;
                }
            }
        })
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        // 5. These callbacks remain exactly the same to transfer the role to the frontend!
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.role = token.role as string;
            }
            return session;
        }
    }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };