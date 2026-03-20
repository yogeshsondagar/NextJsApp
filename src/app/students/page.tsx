'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';

// --- REDUX IMPORTS ---
import { useAppDispatch } from '@/store/store';
import { addToast } from '@/store/toastSlice';

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

// We keep UPDATE and DELETE, but we removed ADD_STUDENT because the API handles it now!
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
  const dispatch = useAppDispatch(); // <-- Redux Dispatcher initialized!

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
  const [isSubmittingAPI, setIsSubmittingAPI] = useState(false);

  // --- APOLLO HOOKS ---
  // Notice we grabbed "refetch" here so we can refresh the list manually after the API call!
  const { data, loading, error, refetch } = useQuery<GetStudentsData>(GET_STUDENTS);

  const [updateStudent, { loading: updateLoading }] = useMutation(UPDATE_STUDENT);
  const [deleteStudent] = useMutation(DELETE_STUDENT, {
    refetchQueries: [{ query: GET_STUDENTS }],
  });

  // --- DATA PROCESSING & SECURITY ---
  const rawStudents = data?.students || [];
  const departments = data?.departments || [];
  
  const authorizedStudents = rawStudents.filter((student) => {
    if (isAdmin) return true;
    if (isDepartment) return student.department_id === userDeptId;
    return false;
  });

  const filteredStudents = authorizedStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payloadDeptId = isDepartment ? userDeptId : (selectedDeptId || null);

    try {
      if (editingId) {
        // --- 1. UPDATE EXISTING (Uses Apollo) ---
        await updateStudent({
          variables: {
            id: editingId,
            name: newStudentName,
            department_id: payloadDeptId,
          },
        });
        setEditingId(null);
        dispatch(addToast({ message: "Intern profile updated successfully!", type: "success" }));
      } else {
        // --- 2. ADD NEW (Uses our Custom API!) ---
        setIsSubmittingAPI(true);
        const res = await fetch('/api/admin/create-intern', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: newStudentName, 
            department_id: payloadDeptId 
          })
        });
        
        const json = await res.json();
        
        if (!res.ok) {
          throw new Error(json.message || "Failed to create intern account");
        }

        // Success! Refetch the Apollo query to show the new student, and fire the Toast!
        await refetch();
        dispatch(addToast({ 
          message: `Intern added! Default password is: ${json.credentials?.password || 'Welcome123!'}`, 
          type: "success" 
        }));
      }

      // Clear the form
      setNewStudentName('');
      setSelectedDeptId('');
    } catch (err: any) {
      console.error("Action error:", err);
      dispatch(addToast({ message: err.message || "An error occurred.", type: "error" }));
    } finally {
      setIsSubmittingAPI(false);
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
        dispatch(addToast({ message: "Record deleted successfully.", type: "info" }));
      } catch (err) {
        console.error("Delete error:", err);
        dispatch(addToast({ message: "Failed to delete record.", type: "error" }));
      }
    }
  };

  const isSaving = updateLoading || isSubmittingAPI;

  if (loading) return <div className="p-8 font-bold text-blue-500 animate-pulse">Loading directory...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;
  if (isIntern) return <div className="p-8 text-center text-red-600">Access Denied</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {isAdmin ? "Global Intern Directory" : "Department Directory"}
      </h1>

      {/* --- FORM SECTION --- */}
      <form onSubmit={handleSubmit} className="mb-8 flex gap-3 bg-white p-5 rounded-lg shadow-sm border items-start">
        <div className="flex-1 space-y-3">
          <input
            type="text"
            placeholder="Intern Name (This will be their login username)"
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            className="border p-2 rounded w-full focus:ring-blue-500"
            required
          />
          <select
            value={isDepartment ? userDeptId : selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            disabled={isDepartment} 
            className={`border p-2 rounded w-full focus:ring-blue-500 text-gray-700 ${
              isDepartment ? "bg-gray-100 cursor-not-allowed opacity-75" : "bg-white"
            }`}
          >
            <option value="">-- Unassigned (No Department) --</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded disabled:opacity-50 transition-colors h-[42px]"
          >
            {isSaving ? 'Saving...' : editingId ? 'Update Record' : 'Create Intern Account'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setNewStudentName(''); setSelectedDeptId(''); }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 border px-4 py-2 rounded text-sm"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* --- LIST SECTION --- */}
      <ul className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredStudents.map((student) => {
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
                  <button onClick={() => handleEditClick(student)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                )}
                {canDelete && (
                  <button onClick={() => handleDelete(student.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
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