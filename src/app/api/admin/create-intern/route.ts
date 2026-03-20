import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const HASURA_URL = process.env.NEXT_PUBLIC_HASURA_URL || 'http://localhost:8080/v1/graphql';
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET || 'myadminsecretkey';

export async function POST(request: Request) {
  try {
    const { name, department_id } = await request.json();

    if (!name) {
      return NextResponse.json({ message: "Intern name is required" }, { status: 400 });
    }

    // 1. Generate default credentials
    // We use the exact name as the username so the Profile query matches it later
    const defaultPassword = "Welcome123!"; 
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 2. Create the User Login (Auth Table)
    const insertUserMutation = `
      mutation InsertInternUser($username: String!, $password: String!) {
        insert_users_one(object: { 
          username: $username, 
          password: $password, 
          role: "intern" 
        }) { id }
      }
    `;

    const userRes = await fetch(HASURA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-hasura-admin-secret': HASURA_ADMIN_SECRET },
      body: JSON.stringify({ query: insertUserMutation, variables: { username: name, password: hashedPassword } })
    });

    const userJson = await userRes.json();

    if (userJson.errors) {
      if (userJson.errors[0].message.includes('Uniqueness violation')) {
        return NextResponse.json({ message: "An intern with this exact name/username already exists." }, { status: 409 });
      }
      throw new Error(userJson.errors[0].message);
    }

    // 3. Create the Intern Profile (Students Table)
    const insertStudentMutation = `
      mutation InsertInternProfile($name: String!, $department_id: uuid) {
        insert_students_one(object: { 
          name: $name, 
          department_id: $department_id, 
          status: "Onboarding" 
        }) { id }
      }
    `;

    await fetch(HASURA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-hasura-admin-secret': HASURA_ADMIN_SECRET },
      body: JSON.stringify({ query: insertStudentMutation, variables: { name, department_id: department_id || null } })
    });

    return NextResponse.json({ 
      message: "Intern created successfully", 
      credentials: { username: name, password: defaultPassword } 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Admin Create Intern Error:", error);
    return NextResponse.json({ message: error.message || "Internal Server Error" }, { status: 500 });
  }
}   