This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


1. src/app/students/page.tsx

What it does: Renders the Students management UI. It handles the form for adding/editing students and displays the filtered list. It reads data from the global store and dispatches actions to modify it.

Next.js Concept: Client Component ('use client'). We explicitly tell Next.js to ship JavaScript to the browser for this file so we can use React Hooks (useState, useEffect) and Redux hooks (useSelector, useDispatch).

2. src/store/studentSlice.ts & src/store/store.ts

What it does: Defines the "rules" for how student data can change (the slice) and configures the central database for our frontend (the store).

Next.js Concept: Framework-Agnostic Logic. These are standard .ts files, meaning they execute standard JavaScript/TypeScript logic without touching React or Next.js rendering cycles directly.

3. src/store/StoreProvider.tsx & src/components/AuthProvider.tsx

What it does: These are bridge components. They take the Redux Store and the NextAuth Session and make them available to the rest of the app.

Next.js Concept: Client Boundaries. In Next.js App Router, you cannot put React Context providers directly into a Server Component. These files act as a Client Component wrapper so we can pass our Server Components through them safely.

4. src/app/layout.tsx

What it does: The root shell of the application. We imported our StoreProvider and AuthProvider here to wrap the entire app, ensuring global state and user sessions are available on every page.

Next.js Concept: Root Layout & Server Components. This file is a Server Component by default. It manages the fundamental HTML structure and SEO metadata.

5. src/app/api/auth/[...nextauth]/route.ts

What it does: Sets up the NextAuth backend configuration, including our temporary "Credentials" provider (mocking the admin/password login).

Next.js Concept: API Routes (Server-Side). The [...nextauth] folder is a Next.js dynamic "catch-all" route. It automatically generates all the necessary backend endpoints (like /api/auth/signin and /api/auth/callback) completely on the server.


Phase 3 Addendum (Auth UI & Middleware)
Goal Achieved: Connected the UI to the authentication state and locked down protected routes using server-side middleware.

📁 Files Created & Modified
1. .env.local

What it does: Stores secret environment variables that should never be committed to GitHub. It holds our NEXTAUTH_URL and NEXTAUTH_SECRET.

Next.js Concept: Environment Variables. Next.js automatically loads variables from this file into the Node.js environment. Variables are strictly server-side by default unless prefixed with NEXT_PUBLIC_.

2. src/components/layout/Header.tsx

What it does: Displays the site navigation and dynamically shows a Login or Logout button (along with the user's name) based on their current session.

Next.js Concept: Client-Side Auth State. By adding 'use client', we allowed this component to use NextAuth's useSession() hook to "listen" to the session cookie in real-time.

3. src/middleware.ts

What it does: Acts as a global guard. It intercepts any requests made to /students (or its sub-routes) and redirects unauthenticated users to the login page.

Next.js Concept: Edge Middleware. This code runs on the edge (before a request even finishes hitting your server). It is the fastest and most secure way to protect pages because the unauthorized user never even begins downloading the page content.

📝 README: Phase 4 (Role-Based Access Control)
Goal Achieved: Implemented UI-level and Route-level security to ensure users can only see and interact with data they are authorized for.

📁 Files Created & Modified
1. src/types/next-auth.d.ts

What it does: Expands the default NextAuth TypeScript definitions to include our custom role property.

Next.js Concept: TypeScript Declaration Merging. Since NextAuth's default session object doesn't know about our "role" requirement, we have to inject our custom types into the library's core definitions so VS Code and the compiler don't throw errors.

2. src/app/api/auth/[...nextauth]/route.ts

What it does: We added the jwt and session callbacks. This intercepts the login process to explicitly pack the user's role into the secure JWT, and then unpacks it onto the frontend session object.

Next.js Concept: Stateless Authentication (JWT). By storing the role inside the encrypted cookie, the frontend doesn't need to query the database on every page load to check permissions.

3. src/app/students/page.tsx

What it does: Reads the user's role from the NextAuth session and conditionally hides the "Add", "Edit", and "Delete" buttons if the user is an Intern.

Next.js Concept: UI-Level RBAC. This is a frontend illusion. It improves user experience by hiding things they can't use, but it does not provide true security (a smart user could still try to dispatch a Redux action manually).

4. src/proxy.ts (Formerly middleware.ts)

What it does: We upgraded our gateway to use withAuth. It intercepts requests to /admin-dashboard, reads the JWT role, and kicks out anyone who isn't an Admin.

Next.js Concept: Route-Level RBAC (Edge Proxy). This is true security. Because the code runs at the network level before the page even begins to render, unauthorized users are physically blocked from downloading the protected content.


