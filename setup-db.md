# Database Setup - Internship Management

Run the following SQL queries to initialize your PostgreSQL database schema for the Internship Management system.

## Prerequisites
- PostgreSQL 13 or later (for `gen_random_uuid()` without extensions).
- If using an older version, run: `CREATE EXTENSION IF NOT EXISTS pgcrypto;`

## Table Definitions

### 1. Departments Table
```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT
);
```

### 2. Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL
);
```

### 3. Students Table
```sql
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Onboarding',
    start_date DATE,
    end_date DATE,
    assigned_manager TEXT
);
```

## Indexes and Constraints
The above queries implicitly create the primary key and unique constraints as specified in your `\d` output:
- `departments_pkey` (Primary Key on `id`)
- `departments_name_key` (Unique on `name`)
- `users_pkey` (Primary Key on `id`)
- `users_username_key` (Unique on `username`)
- `students_pkey` (Primary Key on `id`)

## Foreign Key Relationships
- `users.department_id` references `departments.id` with `ON DELETE SET NULL`.
- `students.department_id` references `departments.id` with `ON DELETE SET NULL`.

## Seeding (Optional)
If you'd like to seed initial data, you can use the following:
```sql
INSERT INTO departments (name, description) VALUES ('Engineering', 'Software development and DevOps');
INSERT INTO departments (name, description) VALUES ('Product', 'Product management and design');
```

---

## 🛰️ Step 2: Track Changes in Hasura

Once your tables are created in PostgreSQL, you must tell Hasura to "track" them so they become available via the GraphQL API.

1. **Open Hasura Console**: Go to [http://localhost:8080](http://localhost:8080) (Admin Secret: `myadminsecretkey`).
2. **Track Tables**:
   - Navigate to the **Data** tab.
   - You should see a list of "Untracked Tables" (`departments`, `students`, `users`).
   - Click **Track All** or click **Track** next to each table.
3. **Track Foreign Key Relationships**:
   - After tracking the tables, stay in the **Data** tab.
   - You will see a notification or a section for "Untracked Foreign Key Relationships".
   - Click **Track All** to automatically create GraphQL relationships:
     - `departments` → `students` (Array relationship)
     - `departments` → `users` (Array relationship)
     - `students` → `department` (Object relationship)
     - `users` → `department` (Object relationship)

### 💡 Why track relationships?
Tracking relationships allows you to perform nested queries. For example, you can fetch a student and their department details in a single GraphQL request:
```graphql
query GetStudentsWithDept {
  students {
    name
    status
    department {
      name
    }
  }
}
```
