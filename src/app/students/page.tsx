// useSelector (to read) and useDispatch (to write).

"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { setInitialStudents, addStudent, deleteStudent, updateStudent } from '@/store/studentSlice';
import { useSession } from 'next-auth/react';


export default function StudentsPage() {

  const dispatch = useDispatch();

  const students = useSelector((state: RootState) => state.students.list);

  const { data: session } = useSession();

  // Define our role flags for clean, readable code
  const isAdmin = session?.user?.role === 'admin';
  const isDepartment = session?.user?.role === 'department';
  const isIntern = session?.user?.role === 'intern';
  const canEdit = isAdmin || isDepartment; // Department and Admin can edit
  const canDelete = isAdmin; // Only Admin can delete

  const [searchQuery, setSearchQuery] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newDepartmentName, setnewDepartmentName] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);

  // initialize with dummy data
  useEffect(() => {

    const mockData = [
      { id: '1', name: 'Alice', department: 'Engineering' },
      { id: '2', name: 'Bob', department: 'Design' },
    ];
    dispatch(setInitialStudents(mockData));
  }, [dispatch]);  // Empty array ensures this only runs once

  //search the student
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  //handles both save and edit of user
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      // EDIT MODE
      dispatch(updateStudent({ id: editingId, name: newStudentName, department: newDepartmentName }));
      setEditingId(null); // Exit edit mode
    } else {
      // ADD MODE
      const newStudent = { id: Date.now().toString(), name: newStudentName, department: newDepartmentName };
      dispatch(addStudent(newStudent));
    }
    setNewStudentName(''); // Clear input
  };

  const handleEditClick = (student: { id: string, name: string, department: string }) => {
    setEditingId(student.id);
    setNewStudentName(student.name);
    setnewDepartmentName(student.department)
  };

  return (
    <div className='p-6'>

      <h1 className="text-2xl font-bold mb-9">Students Management</h1>
      <p className="mb-4 text-sm text-gray-500">Your role: {session?.user?.role}</p>

      <h2 className="text-2xl font-bold mb-4">Search Students</h2>
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search students..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border p-2 mb-4 block"
      />

      <h2 className="text-2xl font-bold mb-4">Add new Students</h2>
      {/* Add Student Form */}
      {!isIntern && (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Student name"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              className="border p-2 mr-2"
              required
            />
            <input
              type="text"
              placeholder="Department name"
              value={newDepartmentName}
              onChange={(e) => setnewDepartmentName(e.target.value)}
              className="border p-2 mr-2"
              required
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white p-2 rounded">
            {editingId ? 'Update Student' : 'Add Student'}
          </button>
          {/* Cancel Edit Button */}
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setNewStudentName(''); }}
              className="ml-2 text-gray-500"
            >
              Cancel
            </button>
          )}
        </form>
      )}

      <h2 className="text-2xl font-bold mb-4">Students List</h2>
      {/* Rendering the List */}
      <ul>
        {filteredStudents.map((student) => (
          <li key={student.id} className="border-b py-2 flex justify-between">
            <span>{student.name} - {student.department}</span>
            <div>
              {/* EDIT & DELETE BUTTONS */}
              {canEdit && (
                <button
                  onClick={() => handleEditClick(student)}
                  className="text-blue-500 mr-4"
                >
                  Edit
                </button>
              )}

              {canDelete && (
                <button
                  onClick={() => dispatch(deleteStudent(student.id))}
                  className="text-red-500"
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}