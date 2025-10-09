import { useState, useEffect } from 'react';

interface ToastProps {
  title: string;
  body: string;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ title, body, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start exit animation before duration ends
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 300);

    // Remove toast after animation
    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div style={{
      ...styles.container,
      animation: isExiting ? 'slideOut 0.3s ease-out forwards' : 'slideIn 0.3s ease-out',
    }}>
      <div style={styles.content}>
        <div style={styles.header}>
          <span style={styles.title}>{title}</span>
          <button onClick={() => {
            setIsExiting(true);
            setTimeout(onClose, 300);
          }} style={styles.closeButton}>
            ×
          </button>
        </div>
        <div style={styles.body}>{body}</div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed' as const,
    top: '20px',
    right: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    minWidth: '300px',
    maxWidth: '400px',
    zIndex: 9999,
    border: '1px solid #e0e0e0',
  },
  content: {
    padding: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  title: {
    fontWeight: 'bold' as const,
    fontSize: '16px',
    color: '#333',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999',
    padding: '0',
    lineHeight: '1',
    width: '24px',
    height: '24px',
  },
  body: {
    fontSize: '14px',
    color: '#666',
    whiteSpace: 'pre-wrap' as const,
  },
};

// Add keyframe animations via style tag
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}
