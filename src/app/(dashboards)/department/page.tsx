"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";

// --- TypeScript Interfaces ---
interface DepartmentInfo {
  id: string;
  name: string;
  description: string | null;
}

interface DepartmentIntern {
  id: string;
  name: string;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  assigned_manager: string | null;
}

interface DepartmentData {
  departments_by_pk: DepartmentInfo | null;
  students: DepartmentIntern[];
}

// --- GraphQL Operations ---
// Notice how we use $department_id to securely filter the data at the database level
const GET_DEPARTMENT_DATA = gql`
  query GetDepartmentData($department_id: uuid!) {
    departments_by_pk(id: $department_id) {
      id
      name
      description
    }
    students(
      where: { department_id: { _eq: $department_id } },
      order_by: { name: asc }
    ) {
      id
      name
      status
      start_date
      end_date
      assigned_manager
    }
  }
`;

// Managers can only update status and their internal manager assignment
const UPDATE_INTERN_TEAM_LOGISTICS = gql`
  mutation UpdateInternTeamLogistics($id: uuid!, $status: String, $assigned_manager: String) {
    update_students_by_pk(
      pk_columns: { id: $id },
      _set: { status: $status, assigned_manager: $assigned_manager }
    ) {
      id
      status
      assigned_manager
    }
  }
`;

// --- Main Component ---
export default function DepartmentDashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const departmentId = session?.user?.department_id;

  // We skip the query if we don't have a departmentId yet to prevent GraphQL errors
  const { data, loading, error } = useQuery<DepartmentData>(GET_DEPARTMENT_DATA, {
    variables: { department_id: departmentId },
    skip: !departmentId,
  });

  const [updateIntern] = useMutation(UPDATE_INTERN_TEAM_LOGISTICS);

  // Handle Loading States
  if (sessionStatus === "loading" || loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Department Workspace...</div>;
  }

  // Handle Authorization/Data Errors
  if (!departmentId) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded border border-red-200 max-w-2xl mx-auto mt-10">
        <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
        <p>Your account is not assigned to a department. Please contact an Administrator.</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Error loading data: {error.message}</div>;
  }

  const department = data?.departments_by_pk;
  const interns = data?.students || [];

  const handleUpdateIntern = async (internId: string, field: keyof DepartmentIntern, value: string) => {
    try {
      await updateIntern({
        variables: {
          id: internId,
          [field]: value === "" ? null : value,
        },
      });
    } catch (err) {
      console.error("Failed to update intern logistics", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {department?.name || "Department"} Workspace
          </h1>
          <p className="text-gray-500 mt-1">
            {department?.description || "Manage your active interns and team assignments."}
          </p>
        </div>
        <div className="flex gap-4 text-sm font-medium text-gray-600">
          <span className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full shadow-sm">
            Active Interns: {interns.length}
          </span>
        </div>
      </header>

      <section className="bg-white p-6 rounded-lg shadow border overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">My Team's Interns</h2>
        
        {interns.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-gray-50 rounded border border-dashed">
            No interns are currently assigned to this department.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Intern Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Direct Manager</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {interns.map((intern) => (
                <tr key={intern.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 font-medium text-gray-900">{intern.name}</td>
                  
                  {/* Direct Manager Input */}
                  <td className="px-4 py-4">
                    <input
                      type="text"
                      placeholder="Assign manager..."
                      value={intern.assigned_manager || ""}
                      onChange={(e) => handleUpdateIntern(intern.id, "assigned_manager", e.target.value)}
                      className="border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-1.5 w-full max-w-[200px]"
                    />
                  </td>

                  {/* Status Dropdown */}
                  <td className="px-4 py-4">
                    <select
                      value={intern.status || "Onboarding"}
                      onChange={(e) => handleUpdateIntern(intern.id, "status", e.target.value)}
                      className={`border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-1.5 font-medium
                        ${intern.status === 'Active' ? 'text-green-700 bg-green-50' : ''}
                        ${intern.status === 'Completed' ? 'text-gray-500 bg-gray-100' : ''}
                        ${intern.status === 'Onboarding' ? 'text-blue-700 bg-blue-50' : ''}
                      `}
                    >
                      <option value="Onboarding">Onboarding</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>

                  {/* Read-Only Duration (Managed by Admin) */}
                  <td className="px-4 py-4 text-gray-600">
                    <div className="flex flex-col text-xs space-y-1">
                      <span><span className="font-medium text-gray-500">Start:</span> {intern.start_date || "TBD"}</span>
                      <span><span className="font-medium text-gray-500">End:</span> {intern.end_date || "TBD"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}