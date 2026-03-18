import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// 1. Define the NextAuth configuration
const authOptions:NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "admin" },
                password: { label: "Password", type: "password" }
            },
            // 2. The authorize function runs when a user hits "Submit" on the login form
            async authorize(credentials) {
                // Let's create two mock users to test our roles!
                if (credentials?.username === "admin" && credentials?.password === "password") {
                    return { id: "1", name: "Admin User", email: "admin@test.com", role: "admin" };
                }
                if (credentials?.username === "intern" && credentials?.password === "password") {
                    return { id: "2", name: "Intern User", email: "intern@test.com", role: "intern" };
                }
                return null;
            }
        })
    ],
    // 1. We must explicitly define callbacks to pass the custom role property
    callbacks: {
        // This runs when the token is created on the server (during login)
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        // This runs when the frontend requests the session
        async session({ session, token }) {
            if (session?.user) {
                session.user.role = token.role;
            }
            return session;
        }
    }
};

// 3. Create the handler
const handler = NextAuth(authOptions);

// 4. Export it for both GET and POST requests (required by Next.js App Router)
export { handler as GET, handler as POST };