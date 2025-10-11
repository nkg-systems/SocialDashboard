/**
 * Dialog Component
 * Secure replacement for browser confirm/alert dialogs
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { Button } from './Button';
import { Card, CardContent } from './Card';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type: 'confirm' | 'alert' | 'error' | 'warning' | 'success';
  confirmText?: string;
  cancelText?: string;
  children?: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  children
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Focus the dialog for accessibility
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Get icon and colors based on dialog type
  const getDialogConfig = () => {
    switch (type) {
      case 'error':
        return {
          icon: (
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          icon: (
            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        };
      case 'success':
        return {
          icon: (
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        };
      default:
        return {
          icon: (
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const config = getDialogConfig();
  const isConfirmDialog = type === 'confirm';

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
    >
      <div
        ref={dialogRef}
        className="bg-background rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className={`${config.bgColor} ${config.borderColor} border-2`}>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {config.icon}
              </div>
              <div className="flex-1">
                <h3 id="dialog-title" className="text-lg font-semibold text-text-default mb-2">
                  {title}
                </h3>
                <div id="dialog-message" className="text-text-muted mb-4">
                  {message}
                  {children}
                </div>
                <div className="flex justify-end space-x-3">
                  {isConfirmDialog && (
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      className="px-4 py-2"
                    >
                      {cancelText}
                    </Button>
                  )}
                  <Button
                    ref={confirmButtonRef}
                    onClick={() => {
                      if (onConfirm) {
                        onConfirm();
                      } else {
                        onClose();
                      }
                    }}
                    className={`px-4 py-2 text-white ${config.buttonColor} focus:ring-2 focus:ring-offset-2`}
                  >
                    {isConfirmDialog ? confirmText : 'OK'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Hook for using dialogs
export const useDialog = () => {
  const [dialog, setDialog] = React.useState<{
    isOpen: boolean;
    type: DialogProps['type'];
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: ''
  });

  const showDialog = (config: Omit<typeof dialog, 'isOpen'>) => {
    setDialog({ ...config, isOpen: true });
  };

  const hideDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  const confirm = (title: string, message: string, onConfirm: () => void) => {
    showDialog({
      type: 'confirm',
      title,
      message,
      onConfirm: () => {
        onConfirm();
        hideDialog();
      }
    });
  };

  const alert = (title: string, message: string, type: 'alert' | 'error' | 'warning' | 'success' = 'alert') => {
    showDialog({
      type,
      title,
      message
    });
  };

  const DialogComponent = () => (
    <Dialog
      isOpen={dialog.isOpen}
      onClose={hideDialog}
      onConfirm={dialog.onConfirm}
      title={dialog.title}
      message={dialog.message}
      type={dialog.type}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
    />
  );

  return {
    confirm,
    alert,
    Dialog: DialogComponent,
    isOpen: dialog.isOpen
  };
};

export default Dialog;