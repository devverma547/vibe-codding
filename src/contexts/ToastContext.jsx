/* oxlint-disable react/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '10px'
      }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{
            padding: '12px 20px',
            borderRadius: '6px',
            color: '#fff',
            backgroundColor: toast.type === 'error' ? '#ef4444' : 
                             toast.type === 'success' ? '#10b981' : 
                             toast.type === 'warning' ? '#f59e0b' : '#3b82f6',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }} onClick={() => removeToast(toast.id)}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
