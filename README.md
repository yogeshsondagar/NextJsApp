# Next.js Full-Stack Application with Hasura & NextAuth

A robust, full-stack Next.js application designed for student management, featuring global state management, secure role-based authentication, and a real-time GraphQL backend.

---

## 🚀 Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/), [Redux Toolkit](https://redux-toolkit.js.org/)
- **Backend/API**: [Hasura GraphQL Engine](https://hasura.io/), [Apollo Client](https://www.apollographql.com/docs/react/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (JWT-based)
- **Infrastructure**: [Docker](https://www.docker.com/)

---

## 🛠️ Getting Started

> [!TIP]
> **New to the project?** Please follow our detailed [Local Development Setup Guide](setup.md) to get running in minutes.

### 1. Prerequisites
- Docker & Docker Compose
- Node.js (Latest LTS recommended)

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### 3. Launch Infrastructure
Starts the PostgreSQL database and Hasura GraphQL engine:

```bash
cd hasura
docker-compose up -d
```

### 4. Run the Application
Install dependencies and start the development server:

```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the result.

---

## 🔐 Role-Based Access Control (RBAC)

The application enforces specific visibility and interaction rules based on the user's role:

| Role | Access Level |
| :--- | :--- |
| **Admin** | Full access: View, Search, Add, Edit, and Delete students. |
| **Staff** | Restricted: View, Search, Add, and Edit students. Cannot Delete. |
| **Intern** | Read-only: View and Search students. No form or action buttons. |

---

## 🏗️ Development Journey & Architecture

This project was built in phases, evolving from a local mock UI to a fully secured, database-backed application.

### Phase 1-2: Core UI & Global State
Built a local-state interactive UI and upgraded it to global state using Redux Toolkit.

- **`src/app/students/page.tsx`**: Renders the Students management UI. Handles the form for adding/editing students and displays the filtered list.
  - *Next.js Concept*: **Client Component (`'use client'`)**. Explicitly ships JavaScript to the browser for React Hooks (useState, useEffect) and Redux hooks.
- **`src/store/studentSlice.ts` & `src/store/store.ts`**: Defines the "rules" for how student data can change and configures the central store.
  - *Next.js Concept*: **Framework-Agnostic Logic**. Standard .ts files executing pure logic without touching React rendering cycles.
- **`src/store/StoreProvider.tsx` & `src/app/layout.tsx`**: Wraps the entire app in the Redux store.
  - *Next.js Concept*: **Client Boundaries**. Bridging Server Components (Layout) with Client Components (Providers).

### Phase 3: Authentication & Security
Integrated NextAuth for session management and route protection.

- **`src/app/api/auth/[...nextauth]/route.ts`**: Sets up NextAuth backend configuration with standard and custom providers.
  - *Next.js Concept*: **API Routes (Server-Side)**. Uses dynamic catch-all routes to automatically generate necessary backend endpoints.
- **`src/middleware.ts`**: Acts as a global guard, intercepting requests to protected routes.
  - *Next.js Concept*: **Edge Middleware**. Runs before a request finishes hitting the server, providing the fastest and most secure way to protect pages.
- **`src/components/layout/Header.tsx`**: Dynamically shows Login/Logout buttons based on authentication state.
  - *Next.js Concept*: **Client-Side Auth State**. Uses `useSession()` to listen to session cookies in real-time.

### Phase 4: RBAC & Advanced Auth
Implemented UI-level and Route-level security.

- **`src/types/next-auth.d.ts`**: Expands default NextAuth definitions to include custom role properties.
  - *Next.js Concept*: **TypeScript Declaration Merging**. Injecting custom types into library core definitions.
- **`src/proxy.ts` (formerly `middleware.ts`)**: Upgraded gateway to use `withAuth` for role-based route blocking.
  - *Next.js Concept*: **Route-Level RBAC (Edge Proxy)**. Physically blocks unauthorized users from downloading protected content.

### Phase 5: Hasura & Apollo Integration
Replaced Redux mocks with a real PostgreSQL database via Hasura and Apollo Client.

- **`hasura/docker-compose.yml`**: Spins up the local backend environment.
  - *Concept*: **Containerization**. Guarantees identical database environments across different machines.
- **`src/lib/apolloClient.ts`**: Configures the connection to the Hasura backend.
- **`src/components/ApolloWrapper.tsx`**: Broadcasts the Apollo Client instance throughout the component tree.
- **`src/app/students/page.tsx` (Refactor)**: Transitioned from Redux to `useQuery` and `useMutation`.
  - *Concept*: **Declarative Data Fetching**. Apollo automatically tracks the network lifecycle and updates the UI instantly.

### Phase 6: User Registration & Persistence
Added permanent user accounts and password security.

- **`src/app/api/register/route.ts`**: A secure middleman that received plain-text passwords and hashes them using **bcryptjs**.
  - *Concept*: **Server-Side Security**. Never exposing database secrets or hashing logic to the client.
- **`src/app/login/page.tsx` & `src/app/register/page.tsx`**: branded, modern Tailwind CSS forms for user interaction.
  - *Concept*: **Separation of Concerns**. The frontend gathers data while the backend handles saving and verification.

---

## 📖 Learn More

To learn more about the technologies used in this project, check out:

- [Next.js Documentation](https://nextjs.org/docs)
- [Hasura GraphQL Engine](https://hasura.io/docs/latest/index/)
- [NextAuth.js Documentation](https://next-auth.js.org/getting-started/introduction)
- [Apollo Client Docs](https://www.apollographql.com/docs/react/)
- [Redux Toolkit](https://redux-toolkit.js.org/introduction/getting-started)

---

## 📂 Project Structure

```text
NextJsApp/
|   .env.local
|   .gitignore
|   eslint.config.mjs
|   next-env.d.ts
|   next.config.ts
|   package.json
|   postcss.config.mjs
|   README.md
|   [setup.md](setup.md) (Local Setup Guide)
|   tsconfig.json
|
+---hasura/
|       docker-compose.yml
|
+---public/
|       file.svg
|       globe.svg
|       next.svg
|       vercel.svg
|       window.svg
|
\---src/
    |   proxy.ts
    |
    +---app/
    |   |   globals.css
    |   |   layout.tsx
    |   |   page.tsx
    |   |
    |   +---admin-dashboard/
    |   |       page.tsx
    |   |
    |   +---api/
    |   |   +---auth/
    |   |   |   \---[...nextauth]/
    |   |   |           route.ts
    |   |   |
    |   |   \---register/
    |   |           route.ts
    |   |
    |   +---login/
    |   |       page.tsx
    |   |
    |   +---register/
    |   |       page.tsx
    |   |
    |   \---students/
    |           page.tsx
    |
    +---components/
    |       ApolloWrapper.tsx
    |       AuthProvider.tsx
    |       Header.tsx
    |
    +---lib/
    |       apolloClient.ts
    |
    +---store/
    |       store.ts
    |       StoreProvider.tsx
    |       studentSlice.ts
    |
    \---types/
            next-auth.d.ts
```

---