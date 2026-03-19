import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// Environment variables for security
const HASURA_URL = process.env.NEXT_PUBLIC_HASURA_URL || 'http://localhost:8080/v1/graphql';
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET || 'myadminsecretkey';

export async function POST(request: Request) {
  try {
    // We now accept department_id from the frontend form
    const { username, password, role, department_id } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // 1. Hash the password securely on the server
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Insert the User into the Authentication table
    const insertUserMutation = `
      mutation InsertUser($username: String!, $password: String!, $role: String!, $department_id: uuid) {
        insert_users_one(object: { 
          username: $username, 
          password: $password, 
          role: $role, 
          department_id: $department_id 
        }) {
          id
          username
        }
      }
    `;

    const userResponse = await fetch(HASURA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET 
      },
      body: JSON.stringify({
        query: insertUserMutation,
        variables: { 
          username, 
          password: hashedPassword, 
          role,
          department_id: department_id || null // Pass null if they didn't select one
        }
      })
    });

    const userResult = await userResponse.json();

    // Gracefully handle Hasura errors (like picking a username that is already taken)
    if (userResult.errors) {
      if (userResult.errors[0].message.includes('Uniqueness violation')) {
        return NextResponse.json({ message: "That username is already taken." }, { status: 409 });
      }
      return NextResponse.json({ message: userResult.errors[0].message }, { status: 400 });
    }

    // 3. THE MAGIC: Auto-generate the Intern Profile
    // If an intern registers, they need a corresponding record in the students table to use the portal
    if (role === 'intern') {
      const insertStudentMutation = `
        mutation InsertStudent($name: String!, $department_id: uuid) {
          insert_students_one(object: { 
            name: $name, 
            department_id: $department_id, 
            status: "Onboarding" 
          }) {
            id
          }
        }
      `;
      
      await fetch(HASURA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': HASURA_ADMIN_SECRET
        },
        body: JSON.stringify({
          query: insertStudentMutation,
          variables: { 
            name: username, // The student name MUST match the username for our Profile query to work
            department_id: department_id || null
          }
        })
      });
    }

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 });

  } catch (error) {
    console.error("Server Registration Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}