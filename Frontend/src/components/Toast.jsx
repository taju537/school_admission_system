import React from 'react';
import { useNotification } from '../context/NotificationContext';
import { CheckCircleIcon, AlertCircleIcon, XCircleIcon } from './Icons';

export function ToastContainer() {
  const { notifications, dismiss } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {notifications.map((n) => {
        let icon = <AlertCircleIcon size={18} />;
        let typeClass = 'toast-info';

        if (n.type === 'success') {
          icon = <CheckCircleIcon size={18} />;
          typeClass = 'toast-success';
        } else if (n.type === 'error') {
          icon = <XCircleIcon size={18} />;
          typeClass = 'toast-error';
        } else if (n.type === 'warning') {
          icon = <AlertCircleIcon size={18} />;
          typeClass = 'toast-warning';
        }

        return (
          <div key={n.id} className={`toast-card ${typeClass}`}>
            <span className="toast-icon">{icon}</span>
            <div className="toast-msg">{n.message}</div>
            <button
              type="button"
              className="toast-close"
              onClick={() => dismiss(n.id)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
