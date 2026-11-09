import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (message, type = 'info', duration = 4500) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 6);
      const newNotification = { id, message, type };

      setNotifications((prev) => [...prev, newNotification]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
      return id;
    },
    [dismiss]
  );

  const success = useCallback((msg, dur) => notify(msg, 'success', dur), [notify]);
  const error = useCallback((msg, dur) => notify(msg, 'error', dur || 6000), [notify]);
  const warning = useCallback((msg, dur) => notify(msg, 'warning', dur), [notify]);
  const info = useCallback((msg, dur) => notify(msg, 'info', dur), [notify]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        notify,
        success,
        error,
        warning,
        info,
        dismiss,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return ctx;
}
