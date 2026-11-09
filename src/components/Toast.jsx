import React from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useAttendance();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        let Icon = Info;
        let variantClass = 'toast-info';
        if (toast.type === 'success') {
          Icon = CheckCircle2;
          variantClass = 'toast-success';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          variantClass = 'toast-error';
        }

        return (
          <div key={toast.id} className={`toast ${variantClass}`}>
            <Icon size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                opacity: 0.7,
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
              aria-label="Dismiss toast"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
