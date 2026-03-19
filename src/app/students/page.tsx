'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';

// --- TYPES ---
interface Department {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  department_id: string | null;
  department: {
    name: string;
  } | null;
}

interface GetStudentsData {
  students: Student[];
  departments: Department[]; 
}

// --- GRAPHQL BLUEPRINTS ---
const GET_STUDENTS = gql`
  query GetAllStudents {
    students(order_by: { name: asc }) { 
      id 
      name 
      department_id
      department {
        name
      }
    }
    departments(order_by: { name: asc }) {
      id
      name
    }
  }
`;

const ADD_STUDENT = gql`
  mutation AddStudent($name: String!, $department_id: uuid) {
    insert_students_one(object: { name: $name, department_id: $department_id }) {
      id 
      name 
      department {
        name
      }
    }
  }
`;

const UPDATE_STUDENT = gql`
  mutation UpdateStudent($id: uuid!, $name: String!, $department_id: uuid) {
    update_students_by_pk(
      pk_columns: { id: $id }, 
      _set: { name: $name, department_id: $department_id }
    ) {
      id 
      name 
      department {
        name
      }
    }
  }
`;

const DELETE_STUDENT = gql`
  mutation DeleteStudent($id: uuid!) {
    delete_students_by_pk(id: $id) { id }
  }
`;

export default function StudentsPage() {
  const { data: session } = useSession();

  // Role Permissions
  const userRole = session?.user?.role;
  const userDeptId = session?.user?.department_id;
  
  const isAdmin = userRole === 'admin';
  const isDepartment = userRole === 'department';
  const isIntern = userRole === 'intern';
  const canDelete = isAdmin; 

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- APOLLO HOOKS ---
  const { data, loading, error } = useQuery<GetStudentsData>(GET_STUDENTS);

  const [addStudent, { loading: addLoading }] = useMutation(ADD_STUDENT, {
    refetchQueries: [{ query: GET_STUDENTS }],
  });

  const [updateStudent, { loading: updateLoading }] = useMutation(UPDATE_STUDENT, {
    refetchQueries: [{ query: GET_STUDENTS }],
  });

  const [deleteStudent] = useMutation(DELETE_STUDENT, {
    refetchQueries: [{ query: GET_STUDENTS }],
  });

  // --- EARLY RETURNS ---
  if (loading) return <div className="p-8 font-bold text-blue-500 animate-pulse">Loading directory...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

  // --- DATA PROCESSING & SECURITY ---
  const rawStudents = data?.students || [];
  const departments = data?.departments || [];
  
  // 1. VISIBILITY SECURITY: Filter out students the user shouldn't see
  const authorizedStudents = rawStudents.filter((student) => {
    if (isAdmin) return true; // Admins see the whole company
    if (isDepartment) return student.department_id === userDeptId; // Managers only see their team
    return false; // Interns see no one on this page
  });

  // 2. SEARCH FILTER: Apply the text search only to the authorized students
  const filteredStudents = authorizedStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payloadDeptId = isDepartment ? userDeptId : (selectedDeptId || null);

    try {
      if (editingId) {
        await updateStudent({
          variables: {
            id: editingId,
            name: newStudentName,
            department_id: payloadDeptId,
          },
        });
        setEditingId(null);
      } else {
        await addStudent({
          variables: {
            name: newStudentName,
            department_id: payloadDeptId,
          },
        });
      }

      setNewStudentName('');
      setSelectedDeptId('');
    } catch (err) {
      console.error("Mutation error:", err);
      alert("Failed to save. Check the console.");
    }
  };

  const handleEditClick = (student: Student) => {
    setEditingId(student.id);
    setNewStudentName(student.name);
    setSelectedDeptId(student.department_id || '');
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this student record?")) {
      try {
        await deleteStudent({ variables: { id } });
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  const isSaving = addLoading || updateLoading;

  // If an intern somehow navigates here, kick them out nicely
  if (isIntern) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center mt-10">
        <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600 mt-2">Interns do not have access to the global directory.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {isAdmin ? "Global Intern Directory" : "Department Directory"}
      </h1>
      <p className="mb-6 text-sm text-gray-500 font-mono bg-gray-100 inline-block px-2 py-1 rounded border">
        Active Role: {userRole || "Loading..."}
      </p>

      <input
        type="text"
        placeholder="Search directory..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border p-2 mb-6 block w-full max-w-md rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
      />

      {/* Form Block */}
      <form onSubmit={handleSubmit} className="mb-8 flex gap-3 bg-white p-5 rounded-lg shadow-sm border items-start">
        <div className="flex-1 space-y-3">
          <input
            type="text"
            placeholder="Intern Name"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            className="border p-2 rounded w-full focus:ring-blue-500 focus:border-blue-500"
            required
          />
          
          <select
            value={isDepartment ? userDeptId : selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            disabled={isDepartment} 
            className={`border p-2 rounded w-full focus:ring-blue-500 focus:border-blue-500 text-gray-700 ${
              isDepartment ? "bg-gray-100 cursor-not-allowed opacity-75" : "bg-white"
            }`}
          >
            <option value="">-- Unassigned (No Department) --</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          {isDepartment && (
            <p className="text-xs text-gray-500">You can only add interns to your own department.</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded disabled:opacity-50 transition-colors h-[42px]"
          >
            {isSaving ? 'Saving...' : editingId ? 'Update Record' : 'Add Intern'}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setNewStudentName('');
                setSelectedDeptId('');
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 border px-4 py-2 rounded transition-colors text-sm"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* List Block */}
      <ul className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredStudents.map((student) => {
          // Managers can edit anyone in this list, because we already filtered out the ones they can't see!
          const canEditThisStudent = isAdmin || isDepartment;

          return (
            <li key={student.id} className="border-b last:border-b-0 py-4 px-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
              <div>
                <span className="font-semibold text-gray-900 text-lg">{student.name}</span>
                <span className="text-gray-600 text-xs font-medium ml-3 px-2.5 py-1 bg-gray-100 border rounded-full">
                  {student.department?.name || "Unassigned"}
                </span>
              </div>

              <div className="space-x-4">
                {canEditThisStudent && (
                  <button onClick={() => handleEditClick(student)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">
                    Delete
                  </button>
                )}
              </div>
            </li>
          );
        })}
        {filteredStudents.length === 0 && (
          <li className="text-gray-500 italic py-8 text-center bg-gray-50">No interns found in the directory.</li>
        )}
      </ul>
    </div>
  );
}