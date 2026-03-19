# 🚀 Local Development Setup Guide

Welcome to the **Internship Management Portal**! This guide will walk you through setting up the application on your local machine. This project integrates [Next.js](https://nextjs.org/), [Hasura GraphQL](https://hasura.io/), and [PostgreSQL](https://www.postgresql.org/) in a containerized environment.

---

## 🛠️ Prerequisites

Before you start, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Git**
- **Docker Desktop**

> [!IMPORTANT]
> **Windows Users**: During Docker installation, ensure the **"Use WSL 2 instead of Hyper-V"** setting is checked. This is required for Docker to run smoothly.

---

## 🛑 Step 1: Environment Variables

For security, we never commit secret keys or database passwords to GitHub. You must create local environment files.

### Create `.env.local`
In the root directory of the Next.js project, create a file named `.env.local` and add the following:

```env
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=my-super-secret-development-string-123r
```

### Understanding the Hasura Secret
Our local Hasura engine uses an admin secret to secure the GraphQL endpoint. This is defined in `hasura/docker-compose.yml` and used in our Next.js API routes (`src/app/api/...`).
- **Default Local Secret**: `myadminsecretkey`

> [!WARNING]
> Ensure `.env.local`, `.env`, and any files containing production credentials are listed in your `.gitignore` file to prevent accidental commits.

---

## 🐳 Step 2: Ignite the Database (Docker)

We use Docker to spin up a pre-configured PostgreSQL database and Hasura GraphQL engine.

1. Open your terminal and navigate to the `hasura` folder:
   ```bash
   cd hasura
   ```
2. Start the containers in the background:
   ```bash
   docker compose up -d
   ```
3. **Verify**: Open [http://localhost:8080](http://localhost:8080) and log in with the secret `myadminsecretkey`. You should see the Hasura Console.

### 🔍 Deep Dive: Docker Compose (`hasura/docker-compose.yml`)

The `docker-compose.yml` file defines how our database and GraphQL engine talk to each other.

| Component | Purpose | Key Configurations |
| :--- | :--- | :--- |
| **postgres** | Stores all application data. | `POSTGRES_DB`: `internship_db`<br>`POSTGRES_PASSWORD`: `mysecretpassword`<br>`5432:5432`: Maps Postgres to your local machine. |
| **hasura** | The GraphQL API layer. | `HASURA_GRAPHQL_ADMIN_SECRET`: Your key to the console.<br>`HASURA_GRAPHQL_DATABASE_URL`: How Hasura connects to Postgres.<br>`8080:8080`: Maps the Hasura Console to your browser. |
| **volumes** | `db_data` | Ensures your data survives even if the containers are deleted. |

#### 🛠️ Essential Docker Commands

| Command | Action |
| :--- | :--- |
| `docker compose up -d` | Start everything in the background. |
| `docker compose stop` | Pause the services without deleting data. |
| `docker compose logs -f` | View live server logs (great for debugging). |
| `docker compose down -v` | **Nuclear Option**: Deletes containers AND all saved data. |

---

## 🧩 Step 3: Next Steps for Hasura Integration

To fully bridge the gap between Hasura and this Next.js app, you will need to continue with these files:

1.  **`src/lib/apolloClient.ts`**: Already configured! It tells React where to find the Hasura API (`localhost:8080`) and which secret to use.
2.  **`src/components/ApolloWrapper.tsx`**: A provider that wraps the entire app, allowing any component to use `useQuery` or `useMutation`.
3.  **`src/app/layout.tsx`**: You must import the `ApolloWrapper` here to enable GraphQL across the whole site.
4.  **`.env.local`**: Ensure your Next.js app has the same admin secret as your Docker file if you use it in server-side actions.

---

## 💻 Step 4: Start the Frontend

Once the database is running, open a new terminal at the project root to start the React application.

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start the Development Server**:
   ```bash
   npm run dev
   ```
3. **Verify**: Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐛 Troubleshooting & Known Issues

### 1. 🌟 The Apollo Client Import Bug (Crucial Fix)
**The Problem**: When importing `ApolloProvider`, `useQuery`, or `useMutation`, you might get a massive red Next.js or TypeScript error saying: `Module '"@apollo/client"' has no exported member...`

**Why it happens**: Next.js (especially the App Router) occasionally struggles to resolve the correct sub-modules from massive libraries like Apollo when switching between Server and Client boundaries.

**The Fix**: Bypass the main package and import the hooks directly from Apollo's specific React folder.

**Change this**:
```typescript
import { useQuery, useMutation, ApolloProvider } from '@apollo/client';
```
**To this exact path**:
```typescript
import { useQuery, useMutation, ApolloProvider } from '@apollo/client/react';

// Note: gql must still be imported from the main package:
import { gql } from '@apollo/client';
```

### 2. VS Code TypeScript Errors
**The Problem**: VS Code's TS server may fall out of sync after installing large packages like Apollo Client.
**The Fix**:
- Press `Ctrl + Shift + P` (or `Cmd + Shift + P` on Mac).
- Type **"TypeScript: Restart TS server"** and press Enter.

### 3. React Infinite Loops / White Screen
**The Problem**: Browser freezes or shows a white screen with infinite console logs.
**The Fix**: Ensure your GraphQL query definitions (using `gql...`) are declared **outside** of the React component function. If they are inside, React recreates the query every render, triggering an infinite loop.

### 4. Hook Order Errors
**The Problem**: "Rendered more hooks than during the previous render".
**The Fix**: Never place a Hook (`useState`, `useQuery`, `useMutation`) below an early return statement. Ensure all Hooks are grouped at the very top of your component.

```typescript
// ❌ BAD
if (loading) return <div>Loading...</div>;
const [addStudent] = useMutation(ADD_STUDENT); 

// ✅ GOOD
const [addStudent] = useMutation(ADD_STUDENT); 
if (loading) return <div>Loading...</div>;
```

### 5. Database "Uniqueness Violation"
**The Problem**: Registration fails with a Postgres constraint error.
**The Fix**: The `users` table requires unique usernames. Choose a different username or use the Hasura Console ([http://localhost:8080](http://localhost:8080)) to delete old test records.

---
*Follow these steps carefully to ensure a smooth development experience.*