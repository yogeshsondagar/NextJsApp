// A "slice" in Redux Toolkit is a combination of actions + reducer that manages one part of the app state.
// Slice = Reducer + Actions + State
import { createSlice } from '@reduxjs/toolkit';

// 1. Define the type again (keeping it here for global reference)
type Student = {
    id: string;
    name: string;
    department: string;
};

const studentSlice = createSlice({
    name: 'students',
    initialState: {
        list: [] as Student[] //global array
    },
    reducers: {
        setInitialStudents: (state, action) => {
            state.list = action.payload;
        },

        addStudent: (state, action) => {
            state.list.push(action.payload);
        },

        deleteStudent: (state, action) => {
            state.list = state.list.filter(student => student.id !== action.payload);
        },

        updateStudent: (state, action) => {
            const index = state.list.findIndex(student => student.id === action.payload.id);
            if (index !== -1) {
                // Overwrite that specific student with the new data
                state.list[index] = action.payload;
            }
        }
    }
});

export const { setInitialStudents, addStudent, deleteStudent, updateStudent } = studentSlice.actions;

export default studentSlice.reducer;