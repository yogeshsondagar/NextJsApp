'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';

// --- GRAPHQL ---
const GET_DEPARTMENTS = gql`
  query GetDepartmentsForRegistration {
    departments(order_by: { name: asc }) {
      id
      name
    }
  }
`;

interface Department {
  id: string;
  name: string;
}

interface GetDepartmentsData {
  departments: Department[];
}

export default function RegisterPage() {
  const router = useRouter();
  
  // Fetch departments for the dropdown
const { data, loading: loadingDepts } = useQuery<GetDepartmentsData>(GET_DEPARTMENTS);
  const departments: Department[] = data?.departments || [];

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('intern'); // Default role
  const [departmentId, setDepartmentId] = useState(''); // New state for department tracking
  
  // UI State
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true); 

    // If they switched to admin, ensure we don't accidentally send a department ID
    const payloadDeptId = role === 'admin' ? null : (departmentId || null);

    try {
      // Send the payload to our newly updated secure Next.js backend
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password, 
          role,
          department_id: payloadDeptId // Include the department!
        }),
      });

      const resultData = await response.json();

      if (!response.ok) {
        throw new Error(resultData.message || "Failed to register");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.message.includes("Uniqueness violation") || err.message.includes("constraint") || err.message.includes("taken")) {
        setError("That username is already taken. Please choose another.");
      } else {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create an Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the Internship Management Portal
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center border border-red-100">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm text-center border border-green-100 font-medium">
              Account created successfully! Redirecting to login...
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Role</label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  // Auto-clear department if they switch to admin
                  if (e.target.value === 'admin') setDepartmentId('');
                }}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
              >
                <option value="intern">Intern (View Only)</option>
                <option value="department">Department Manager (Can Edit)</option>
                <option value="admin">System Admin (Full Access)</option>
              </select>
            </div>

            {/* Conditionally Render the Department Dropdown */}
            {role !== 'admin' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Department <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  disabled={loadingDepts}
                  className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg ${loadingDepts ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}`}
                >
                  <option value="">-- Unassigned --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 transition-colors"
            >
              {isSubmitting ? 'Creating Account...' : 'Register'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in here
          </Link>
        </div>

      </div>
    </div>
  );
}