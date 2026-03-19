"use client"

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Header() {
  const { data: session, status } = useSession();

  // Extract role safely from the session
  const role = session?.user?.role;

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center mb-6">
      <nav className="space-x-6 flex items-center">
        <Link href="/" className="font-bold text-gray-800">
          Home
        </Link>

        {/* --- Admin Navigation --- */}
        {role === 'admin' && (
          <>
            <Link href="/admin-dashboard" className="text-gray-600 hover:text-blue-600 font-medium">
              Dashboard
            </Link>
            <Link href="/students" className="text-gray-600 hover:text-blue-600 font-medium">
              All Students
            </Link>
          </>
        )}

        {/* --- Department Navigation --- */}
        {role === 'department' && (
          <>
            <Link href="/department" className="text-gray-600 hover:text-blue-600 font-medium">
              My Department
            </Link>
            <Link href="/students" className="text-gray-600 hover:text-blue-600 font-medium">
              Department Students
            </Link>
          </>
        )}

        {/* --- Intern Navigation --- */}
        {role === 'intern' && (
          <>
            <Link href="/profile" className="text-gray-600 hover:text-blue-600 font-medium">
              My Placement
            </Link>
          </>
        )}
      </nav>

      {/* Conditional Rendering based on Auth State */}
      <div>
        {status === 'loading' ? (
          <span className="text-gray-500 text-sm animate-pulse">Loading...</span>
        ) : session ? (
          <div className="flex items-center space-x-4">
            <div className="flex flex-col text-right">
              <span className="text-sm text-gray-700">
                Welcome, <span className="font-bold">{session.user?.name || session.user?.username}</span>
              </span>
              <span className="text-xs text-blue-500 font-semibold uppercase tracking-wider">
                {role}
              </span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white transition-colors px-3 py-1.5 rounded font-medium"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn()}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded font-medium transition-colors"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}