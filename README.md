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
- **`src/store/toastSlice.ts` & `src/store/store.ts`**: Defines the "rules" for UI state (notifications) and configures the central store.
  - *Next.js Concept*: **Framework-Agnostic Logic**. Standard .ts files executing pure logic without touching React rendering cycles.
- **`src/store/StoreProvider.tsx` & `src/app/layout.tsx`**: Wraps the entire app in the Redux store.
  - *Next.js Concept*: **Client Boundaries**. Bridging Server Components (Layout) with Client Components (Providers).

### Phase 3: Authentication & Security
Integrated NextAuth for session management and route protection.

- **`src/app/api/auth/[...nextauth]/route.ts`**: Sets up NextAuth backend configuration with standard and custom providers.
  - *Next.js Concept*: **API Routes (Server-Side)**. Uses dynamic catch-all routes to automatically generate necessary backend endpoints.
- **`src/middleware.ts`**: Acts as a global guard, intercepting requests to protected routes.
  - *Next.js Concept*: **Edge Middleware**. Runs before a request finishes hitting the server, providing the fastest and most secure way to protect pages.
- **`src/components/Header.tsx`**: Dynamically shows Login/Logout buttons based on authentication state.
  - *Next.js Concept*: **Client-Side Auth State**. Uses `useSession()` to listen to session cookies in real-time.
- **`src/types/next-auth.d.ts`**: Expands default NextAuth definitions to include custom role properties.
  - *Next.js Concept*: **TypeScript Declaration Merging**. Injecting custom types into library core definitions.

### Phase 4: RBAC & Advanced Auth
Implemented UI-level and Route-level security.

- **`src/middleware.ts` (formerly `middleware.ts`)**: Upgraded gateway to use `withAuth` for role-based route blocking.
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
- **`src/app/(auth)/login/page.tsx` & `src/app/(auth)/register/page.tsx`**: branded, modern Tailwind CSS forms for user interaction.
  - *Concept*: **Separation of Concerns**. The frontend gathers data while the backend handles saving and verification.


### Phase 7: Role-Based Internship Management Portal

#### Architectural Pivot
Shifted the database and application logic from a multi-company SaaS model to a **single-company internal portal**. The primary organizational unit is now the `Department`, managed by users with the `department` role, overseeing `interns` (students).

---

#### 1. Database Schema Changes (PostgreSQL / Hasura)
Executed raw SQL migrations and tracked new GraphQL relationships in the Hasura Console.
* **Added `departments` table**: Contains `id` (UUID), `name`, and `description`.
* **Updated `users` table**: Added `department_id` as a Foreign Key to link Department Managers to their specific team.
* **Updated `students` table (Intern Profiles)**:
  * Dropped the legacy `department` (text) column.
  * Added `department_id` (Foreign Key).
  * Added logistics columns: `status` (Text: Onboarding, Active, Completed), `start_date` (Date), `end_date` (Date), and `assigned_manager` (Text).

---

#### 2. Type Augmentations
* **`src/types/next-auth.d.ts`**:
  * Modified NextAuth types to expose custom Hasura columns to the frontend.
  * Added `id`, `role`, `username`, and `department_id` to the `Session`, `User`, and `JWT` interfaces to ensure full TypeScript safety across the app.

---

#### 3. Backend & API Modifications
* **`src/app/api/auth/[...nextauth]/route.ts`**:
  * Updated the Hasura GraphQL query inside the `authorize` callback to fetch the user's `id` and `department_id`.
  * Updated the `jwt` and `session` callbacks to securely pass these new fields to the client.
* **`src/app/api/register/route.ts`**:
  * Upgraded to accept `department_id` from the frontend.
  * Added automated onboarding logic: If a user registers with the `intern` role, the API now seamlessly executes a second GraphQL mutation to generate a blank record for them in the `students` table.
* **`src/app/api/seed/route.ts` (Temporary)**:
  * Created a database seeding script to securely hash passwords and populate dummy Departments, Managers, and Interns. *(Note: This file was deleted after successful execution for security).*

---
 
#### 4. Frontend Pages & Components Created/Modified
* **`src/components/Header.tsx` (Modified)**:
  * Replaced static links with dynamic, role-aware conditional rendering based on `session.user.role`.
* **`src/app/(dashboards)/admin-dashboard/page.tsx` (New)**:
  - Built the God-mode view for Admins to create new Departments and assign interns to those departments via Apollo Client mutations.
* **`src/app/(dashboards)/department/page.tsx` (New)**:
  - Built the scoped workspace for Department Managers. Uses `session.user.department_id` to query Hasura so managers exclusively see and manage their own team's logistics.
* **`src/app/(dashboards)/profile/page.tsx` (New)**:
  - Built the read-only Intern Dashboard. Queries the `students` table matching `session.user.username` to display onboarding status, dates, and manager assignments.
* **`src/app/students/page.tsx` (Modified)**:
  * Upgraded the global directory to use a dynamic dropdown for department assignment.
  * Implemented Row-Level UI Security: Department Managers are visually restricted to seeing and editing only the interns belonging to their assigned `department_id`.
* **`src/app/(auth)/register/page.tsx` (Modified)**:
  - Integrated Apollo `useQuery` to fetch live departments for a selection dropdown.
  - Added conditional logic to hide the department dropdown if the user registers as a global "Admin".

---

### Phase 8: Syncing Users & Redux UI State
Improved the onboarding flow by automating user account creation and providing real-time UI feedback.

- **`src/app/api/admin/create-intern/route.ts`**: A new administrative endpoint that simultaneously creates a Hasura user (with hashed password) and a corresponding intern profile.
  - *Concept*: **Atomic Operations**. Ensuring both the auth record and the application profile are created successfully in a single workflow.
- **`src/store/toastSlice.ts` & `src/components/ToastContainer.tsx`**: Replaced the legacy Redux student state with a dedicated UI notification system.
  - *Concept*: **UI-Centric State Management**. Using Redux exclusively for transient, application-wide data like toast notifications.
- **`src/app/students/page.tsx` (Advanced Integration)**: Linked the frontend form to the new admin API and implemented automated UI triggers.
  - *Concept*: **Hybrid Data Flow**. Combining Apollo GraphQL for data synchronization with standard REST `fetch` for specialized secure operations.
- **`src/store/store.ts` (Typed Hooks)**: Added `useAppDispatch` and `useAppSelector` for full type safety in Redux interactions.

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
|   [setup-db.md](setup-db.md) (Database Setup)
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
    |   middleware.ts
    |
    +---app/
    |   |   favicon.ico
    |   |   globals.css
    |   |   layout.tsx
    |   |   page.tsx
    |   |
    |   +---(auth)/
    |   |   +---login/
    |   |   |       page.tsx
    |   |   \---register/
    |   |           page.tsx
    |   |
    |   +---(dashboards)/
    |   |   +---admin-dashboard/
    |   |   |       page.tsx
    |   |   +---department/
    |   |   |       page.tsx
    |   |   \---profile/
    |   |           page.tsx
    |   |
    |   +---students/
    |   |           page.tsx
    |   |
    |   \---api/
    |       +---auth/
    |       |   \---[...nextauth]/
    |       |           route.ts
    |       +---register/
    |       |       route.ts
    |       \---admin/
    |           \---create-intern/
    |                   route.ts
    |
    +---components/
    |       ApolloWrapper.tsx
    |       AuthProvider.tsx
    |       Header.tsx
    |       ToastContainer.tsx
    |
    +---lib/
    |       apolloClient.ts
    |
    +---store/
    |       store.ts
    |       StoreProvider.tsx
    |       toastSlice.ts
    |
    \---types/
            next-auth.d.ts
```