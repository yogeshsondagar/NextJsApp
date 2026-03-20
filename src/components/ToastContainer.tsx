'use client';

import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/store';
// 1. We import the ToastMessage type here
import { removeToast, ToastMessage } from '@/store/toastSlice'; 

export default function ToastContainer() {
  const toasts = useAppSelector((state) => state.toast.toasts);
  const dispatch = useAppDispatch();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dispatch(removeToast(toast.id))} />
      ))}
    </div>
  );
}

// 2. We replace `any` with `ToastMessage` right here
function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000); 
    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Because toast is now strictly typed, TypeScript knows toast.type will always match one of these keys!
  const colors = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white',
  };

  return (
    <div className={`px-4 py-3 rounded shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto ${colors[toast.type]}`}>
      <span className="font-medium text-sm">{toast.message}</span>
      <button onClick={onDismiss} className="opacity-70 hover:opacity-100 font-bold ml-4">
        ✕
      </button>
    </div>
  );
}