"use client"

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Header() {

  const { data: session, status } = useSession();

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center mb-6">
      <nav className="space-x-6">
        <Link href="/" className="font-bold text-gray-800">Home</Link>
        <Link href="/students" className="text-gray-600 hover:text-blue-600">Students</Link>
        {/* Your other placeholder links here */}
      </nav>

      {/* 2. Conditional Rendering based on Auth State */}
      <div>
        {status === 'loading' ? (
          <span className="text-gray-500 text-sm">Loading...</span>
        ) : session ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              Welcome, <span className="font-bold">{session.user?.name}</span>
            </span>
            <button 
              onClick={() => signOut()} 
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              Logout
            </button>
          </div>
        ) : (
          <button 
            onClick={() => signIn()} 
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}