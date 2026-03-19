import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "johndoe" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing username or password");
        }

        // 1. Fetch the user from Hasura using native fetch
        const HASURA_URL = process.env.NEXT_PUBLIC_HASURA_URL || "http://localhost:8080/v1/graphql";
        const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET || "myadminsecretkey";

        const query = `
          query GetUserByUsername($username: String!) {
            users(where: { username: { _eq: $username } }) {
              id
              username
              password
              role
              department_id
            }
          }
        `;

        const response = await fetch(HASURA_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
          },
          body: JSON.stringify({
            query,
            variables: { username: credentials.username },
          }),
        });

        const json = await response.json();
        const user = json.data?.users?.[0];

        if (!user) {
          throw new Error("Invalid username or password");
        }

        // 2. Verify the hashed password
        const isValidPassword = await bcrypt.compare(credentials.password, user.password);

        if (!isValidPassword) {
          throw new Error("Invalid username or password");
        }

        // 3. Return the user object (this gets passed to the JWT callback)
        return {
          id: user.id,
          name: user.username, // Fallback for standard NextAuth UI
          username: user.username,
          role: user.role,
          department_id: user.department_id,
        };
      },
    }),
  ],
  callbacks: {
    // Step 1: Transfer data from the 'authorize' return object to the JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.department_id = user.department_id;
      }
      return token;
    },
    // Step 2: Transfer data from the JWT to the client Session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.department_id = token.department_id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // Points to your custom login page
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };