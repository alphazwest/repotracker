import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

export type ToastSeverity = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  severity: ToastSeverity;
}

export interface ToastContextValue {
  notify: (message: string, severity?: ToastSeverity) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_HIDE_MS = 5000;

export interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Global toast surface for action results and GitHub/API failures. Exposes
 * `notify`/`success`/`error` via context; renders one MUI Snackbar at a time.
 */
export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [current, setCurrent] = useState<Toast | null>(null);

  const notify = useCallback((message: string, severity: ToastSeverity = 'info') => {
    setCurrent({ id: Date.now() + Math.random(), message, severity });
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      notify,
      success: (message: string) => notify(message, 'success'),
      error: (message: string) => notify(message, 'error'),
    }),
    [notify],
  );

  const handleClose = useCallback(() => setCurrent(null), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={current !== null}
        autoHideDuration={AUTO_HIDE_MS}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {current ? (
          <Alert
            onClose={handleClose}
            severity={current.severity}
            variant="filled"
            role="alert"
          >
            {current.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
};
