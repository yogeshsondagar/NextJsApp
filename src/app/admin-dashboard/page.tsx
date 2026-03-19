"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";


// --- TypeScript Interfaces ---
interface Department {
  id: string;
  name: string;
  description: string | null;
}

interface Intern {
  id: string;
  name: string;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  assigned_manager: string | null;
  department_id: string | null;
  department: {
    name: string;
  } | null;
}

interface DashboardData {
  departments: Department[];
  students: Intern[]; // Using 'students' to match your Hasura table name
}

// --- GraphQL Operations ---
const GET_ADMIN_DASHBOARD_DATA = gql`
  query GetAdminDashboardData {
    departments(order_by: { name: asc }) {
      id
      name
      description
    }
    students(order_by: { name: asc }) {
      id
      name
      status
      start_date
      end_date
      assigned_manager
      department_id
      department {
        name
      }
    }
  }
`;

const CREATE_DEPARTMENT = gql`
  mutation CreateDepartment($name: String!, $description: String) {
    insert_departments_one(object: { name: $name, description: $description }) {
      id
      name
    }
  }
`;

const UPDATE_INTERN_LOGISTICS = gql`
  mutation UpdateInternLogistics(
    $id: uuid!, 
    $department_id: uuid, 
    $status: String, 
    $start_date: date, 
    $end_date: date, 
    $assigned_manager: String
  ) {
    update_students_by_pk(
      pk_columns: { id: $id }, 
      _set: {
        department_id: $department_id,
        status: $status,
        start_date: $start_date,
        end_date: $end_date,
        assigned_manager: $assigned_manager
      }
    ) {
      id
      status
      department {
        name
      }
    }
  }
`;

// --- Main Component ---
export default function AdminDashboard() {
  // Pass the DashboardData interface to useQuery!
  const { data, loading, error } = useQuery<DashboardData>(GET_ADMIN_DASHBOARD_DATA);

  const [createDepartment] = useMutation(CREATE_DEPARTMENT, {
    refetchQueries: [{ query: GET_ADMIN_DASHBOARD_DATA }],
  });
  const [updateIntern] = useMutation(UPDATE_INTERN_LOGISTICS);

  // Local State
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");

  if (loading) return <div className="p-8 text-center text-gray-500 animate-pulse">Loading Admin Dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading data: {error.message}</div>;

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    try {
      await createDepartment({ variables: { name: newDeptName, description: newDeptDesc } });
      setNewDeptName("");
      setNewDeptDesc("");
    } catch (err) {
      console.error("Failed to create department", err);
      alert("Failed to create department. Check console.");
    }
  };

  const handleUpdateIntern = async (internId: string, field: keyof Intern, value: string | null) => {
    try {
      await updateIntern({
        variables: {
          id: internId,
          [field]: value === "" ? null : value,
        },
      });
    } catch (err) {
      console.error("Failed to update intern", err);
    }
  };

  // Safe fallback if data is somehow undefined
  const departments = data?.departments || [];
  const students = data?.students || [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">XYZ Company Internship Portal</h1>
          <p className="text-gray-500 mt-1">Global Admin Dashboard</p>
        </div>
        <div className="flex gap-4 text-sm font-medium text-gray-600">
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
            Total Interns: {students.length}
          </span>
          <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full">
            Departments: {departments.length}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* --- LEFT COLUMN: Departments --- */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-semibold mb-4">Add Department</h2>
            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department Name</label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Engineering"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                Create Department
              </button>
            </form>
          </section>

          <section className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-semibold mb-4">Active Departments</h2>
            <ul className="space-y-3">
              {departments.map((dept) => (
                <li key={dept.id} className="p-3 bg-gray-50 rounded border">
                  <div className="font-medium text-gray-900">{dept.name}</div>
                  {dept.description && <div className="text-xs text-gray-500 mt-1">{dept.description}</div>}
                </li>
              ))}
              {departments.length === 0 && (
                <p className="text-sm text-gray-500 italic">No departments created yet.</p>
              )}
            </ul>
          </section>
        </div>

        {/* --- RIGHT COLUMN: Intern Management --- */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-lg shadow border overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4">Intern Directory & Placements</h2>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Department</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Start Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((intern) => (
                  <tr key={intern.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{intern.name}</td>

                    {/* Department Assignment Dropdown */}
                    <td className="px-4 py-3">
                      <select
                        value={intern.department_id || ""}
                        onChange={(e) => handleUpdateIntern(intern.id, "department_id", e.target.value)}
                        className="border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-1"
                      >
                        <option value="">Unassigned</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Status Dropdown */}
                    <td className="px-4 py-3">
                      <select
                        value={intern.status || "Onboarding"}
                        onChange={(e) => handleUpdateIntern(intern.id, "status", e.target.value)}
                        className="border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-1"
                      >
                        <option value="Onboarding">Onboarding</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>

                    {/* Start Date Input */}
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={intern.start_date || ""}
                        onChange={(e) => handleUpdateIntern(intern.id, "start_date", e.target.value)}
                        className="border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm p-1"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

      </div>
    </div>
  );
}