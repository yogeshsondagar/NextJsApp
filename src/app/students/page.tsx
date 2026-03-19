'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';

// --- TYPES ---
interface Student {
  id: string;
  name: string;
  department: string;
}

interface GetStudentsData {
  students: Student[];
}

// --- GRAPHQL BLUEPRINTS ---
const GET_STUDENTS = gql`
  query GetAllStudents {
    students { id name department }
  }
`;

const ADD_STUDENT = gql`
  mutation AddStudent($name: String!, $department: String!) {
    insert_students_one(object: { name: $name, department: $department }) {
      id name department
    }
  }
`;

const UPDATE_STUDENT = gql`
  mutation UpdateStudent($id: uuid!, $name: String!, $department: String!) {
    update_students_by_pk(
      pk_columns: { id: $id }, 
      _set: { name: $name, department: $department }
    ) {
      id name department
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
  const isAdmin = session?.user?.role === 'admin';
  const isDepartment = session?.user?.role === 'department';
  const isIntern = session?.user?.role === 'intern';
  const canEdit = isAdmin || isDepartment;
  const canDelete = isAdmin;

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- APOLLO HOOKS (Must be at the top!) ---
  const { data, loading, error } = useQuery<GetStudentsData>(GET_STUDENTS);

  const [addStudent, { loading: addLoading }] = useMutation(ADD_STUDENT, {
    refetchQueries: [{ query: GET_STUDENTS }],
  });

  // NEW: Update Hook
  const [updateStudent, { loading: updateLoading }] = useMutation(UPDATE_STUDENT, {
    refetchQueries: [{ query: GET_STUDENTS }],
  });

  // NEW: Delete Hook
  const [deleteStudent] = useMutation(DELETE_STUDENT, {
    refetchQueries: [{ query: GET_STUDENTS }],
  });

  // --- EARLY RETURNS ---
  if (loading) return <div className="p-8 font-bold text-blue-500">Loading students from Hasura...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

  // --- DATA PROCESSING ---
  const realStudents = data?.students || [];
  const filteredStudents = realStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        // If we have an editingId, run the UPDATE mutation
        await updateStudent({
          variables: {
            id: editingId,
            name: newStudentName,
            department: newDepartmentName,
          },
        });
        setEditingId(null); // Clear edit mode
      } else {
        // Otherwise, run the ADD mutation
        await addStudent({
          variables: {
            name: newStudentName,
            department: newDepartmentName || "General",
          },
        });
      }

      // Clear the form
      setNewStudentName('');
      setNewDepartmentName('');
      
    } catch (err) {
      console.error("Mutation error:", err);
      alert("Failed to save. Check the console.");
    }
  };

  // NEW: Populate the form when clicking Edit
  const handleEditClick = (student: Student) => {
    setEditingId(student.id);
    setNewStudentName(student.name);
    setNewDepartmentName(student.department);
  };

  // NEW: Fire the Delete mutation
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      try {
        await deleteStudent({ variables: { id } });
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  const isSaving = addLoading || updateLoading;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Students Management</h1>
      <p className="mb-6 text-sm text-gray-500 font-mono bg-gray-100 inline-block px-2 py-1 rounded">
        Active Role: {session?.user?.role}
      </p>

      <input 
        type="text" 
        placeholder="Search students..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border p-2 mb-6 block w-full max-w-md rounded shadow-sm"
      />

      {!isIntern && (
        <form onSubmit={handleSubmit} className="mb-8 flex gap-2 bg-white p-4 rounded shadow-sm border">
          <input 
            type="text" 
            placeholder="Student Name" 
            value={newStudentName}
            onChange={(e) => setNewStudentName(e.target.value)}
            className="border p-2 rounded flex-1"
            required
          />
          <input 
            type="text" 
            placeholder="Department" 
            value={newDepartmentName}
            onChange={(e) => setNewDepartmentName(e.target.value)}
            className="border p-2 rounded flex-1"
            required
          />
          <button 
            type="submit" 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded disabled:opacity-50 transition-colors"
          >
            {isSaving ? 'Saving...' : editingId ? 'Update Student' : 'Add Student'}
          </button>
          
          {/* Cancel Edit Button */}
          {editingId && (
            <button 
              type="button" 
              onClick={() => {
                setEditingId(null);
                setNewStudentName('');
                setNewDepartmentName('');
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded transition-colors"
            >
              Cancel
            </button>
          )}
        </form>
      )}

      <ul className="bg-white rounded shadow-sm border overflow-hidden">
        {filteredStudents.map((student) => (
          <li key={student.id} className="border-b last:border-b-0 py-3 px-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
            <div>
              <span className="font-semibold text-gray-800">{student.name}</span> 
              <span className="text-gray-500 text-sm ml-2 px-2 py-0.5 bg-gray-100 rounded-full">{student.department}</span>
            </div>
            
            <div className="space-x-4">
              {canEdit && (
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
        ))}
        {filteredStudents.length === 0 && (
          <li className="text-gray-400 italic py-6 text-center">No students found.</li>
        )}
      </ul>
    </div>
  );
}