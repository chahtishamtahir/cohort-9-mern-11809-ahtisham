import React, { useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastContext } from './ToastContextDefinition';

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    info: (message, duration) => addToast(message, 'info', duration)
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Notification Container (Bottom Right) */}
      <div
        className="toast-container"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '10px',
          maxWidth: '420px',
          width: 'calc(100% - 32px)',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';

          return (
            <div
              key={t.id}
              role="alert"
              className="toast-pill"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 18px',
                backgroundColor: 'var(--canvas)',
                color: 'var(--ink)',
                border: '1px solid var(--hairline)',
                borderRadius: 'var(--rounded-full)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.16)',
                backdropFilter: 'blur(8px)',
                animation: 'slideUpToast 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                fontSize: '0.88rem',
                fontWeight: 500
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                {isSuccess ? (
                  <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                ) : isError ? (
                  <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                ) : (
                  <Info size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                )}
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'normal',
                    lineHeight: 1.4
                  }}
                >
                  {t.message}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="btn btn-ghost btn-sm"
                style={{
                  padding: '4px',
                  borderRadius: 'var(--rounded-full)',
                  color: 'var(--text-muted)',
                  marginLeft: '8px',
                  flexShrink: 0
                }}
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
