import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import toastReducer from './toastSlice';    

export const store = configureStore({
    reducer: {
    toast: toastReducer, 
  },
}) ;

// store.getState() → gets current state (runtime)
// typeof store.getState → type of the function
// ReturnType<typeof store.getState> → type of the returned state
// RootState = the entire Redux state, fully typed, automatically matching your store.
export type RootState = ReturnType<typeof store.getState>;

// store.dispatch → the actual dispatch function of the store
// typeof store.dispatch → the type of that function
// AppDispatch → a reusable TypeScript type for typed dispatch everywhere in your app
// It ensures type-safe actions and thunks, preventing mistakes and improving autocomplete.
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;