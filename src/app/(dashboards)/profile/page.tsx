"use client";

import { useSession } from "next-auth/react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import Link from "next/link";

// --- TypeScript Interfaces ---
interface Department {
  name: string;
  description: string | null;
}

interface InternProfile {
  id: string;
  name: string;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  assigned_manager: string | null;
  department: Department | null;
}

interface ProfileData {
  students: InternProfile[];
}

// --- GraphQL Operations ---
// We fetch the student record that matches the logged-in user's username
const GET_INTERN_PROFILE = gql`
  query GetInternProfile($username: String!) {
    students(where: { name: { _eq: $username } }) {
      id
      name
      status
      start_date
      end_date
      assigned_manager
      department {
        name
        description
      }
    }
  }
`;

// --- Main Component ---
export default function InternProfile() {
  const { data: session, status: sessionStatus } = useSession();
  const username = session?.user?.username;

  // Skip query until session is loaded to prevent GraphQL errors
  const { data, loading, error } = useQuery<ProfileData>(GET_INTERN_PROFILE, {
    variables: { username },
    skip: !username,
  });

  if (sessionStatus === "loading" || loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading your profile...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error loading profile: {error.message}</div>;
  }

  // Extract the first matching student record
  const profile = data?.students?.[0];

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-8 text-center bg-white rounded-lg shadow border">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
        <p className="text-gray-600 mb-6">
          We couldn't find an internship record matching the username <span className="font-semibold">"{username}"</span>. 
          Please ensure your HR administrator has created your student record.
        </p>
        <Link href="/" className="text-blue-600 hover:underline font-medium">
          &larr; Return Home
        </Link>
      </div>
    );
  }

  // Styling helpers for the status badge
  const statusColors: Record<string, string> = {
    Onboarding: "bg-blue-100 text-blue-800 border-blue-200",
    Active: "bg-green-100 text-green-800 border-green-200",
    Completed: "bg-gray-100 text-gray-800 border-gray-200",
  };
  const badgeColor = profile.status ? statusColors[profile.status] || statusColors.Onboarding : statusColors.Onboarding;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <header className="bg-white p-8 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {profile.name}!</h1>
          <p className="text-gray-500 mt-1 text-lg">XYZ Company Internship Portal</p>
        </div>
        <div className={`px-4 py-2 rounded-full border font-semibold tracking-wide uppercase text-sm ${badgeColor}`}>
          Status: {profile.status || "Onboarding"}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Department Info Card */}
        <section className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            🏢 Department Details
          </h2>
          {profile.department ? (
            <div className="space-y-3">
              <div>
                <span className="block text-sm font-medium text-gray-500">Assigned Team</span>
                <span className="text-lg font-medium text-gray-900">{profile.department.name}</span>
              </div>
              {profile.department.description && (
                <div>
                  <span className="block text-sm font-medium text-gray-500">About the Team</span>
                  <span className="text-gray-700">{profile.department.description}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">You have not been assigned to a department yet.</p>
          )}
        </section>

        {/* Logistics & Schedule Card */}
        <section className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            📅 Placement Logistics
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 border-b pb-4">
              <div>
                <span className="block text-sm font-medium text-gray-500">Start Date</span>
                <span className="font-medium text-gray-900">{profile.start_date || "TBD"}</span>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-500">End Date</span>
                <span className="font-medium text-gray-900">{profile.end_date || "TBD"}</span>
              </div>
            </div>
            
            <div>
              <span className="block text-sm font-medium text-gray-500">Direct Manager</span>
              <span className="font-medium text-gray-900">{profile.assigned_manager || "Pending Assignment"}</span>
            </div>

            {/* Static Orientation Reminder */}
            {profile.status === "Onboarding" && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
                <strong>Next Step:</strong> Your mandatory internship orientation is scheduled for January 5th. Please monitor your email for the meeting link.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}