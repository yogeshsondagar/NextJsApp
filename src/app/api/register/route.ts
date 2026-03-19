import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

const INSERT_USER_MUTATION = `
  mutation InsertUser($username: String!, $password: String!, $role: String!) {
    insert_users_one(object: { username: $username, password: $password, role: $role }) {
      id
      username
    }
  }
`;

export async function POST(request: Request) {
  try {
    const { username, password, role } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // 1. THE MAGIC: Hash the password securely on the server!
    // The "10" is the salt rounds. It determines how complex the hash is.
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Send the HASHED password to Hasura, not the plain text one
    const response = await fetch('http://localhost:8080/v1/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': 'myadminsecretkey' // Secure because it's on the server!
      },
      body: JSON.stringify({
        query: INSERT_USER_MUTATION,
        variables: { 
          username, 
          password: hashedPassword, // Passing the hash
          role 
        }
      })
    });

    const result = await response.json();

    if (result.errors) {
      return NextResponse.json({ message: result.errors[0].message }, { status: 400 });
    }

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 });

  } catch (error) {
    console.error("Server Registration Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}