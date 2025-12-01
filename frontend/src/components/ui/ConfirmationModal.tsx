'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger' | 'warning';
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmationModalProps) {
  const { isDark, text, mutedText, themeClasses } = useThemeColors();

  const handleConfirm = async () => {
    await onConfirm();
  };

  const variantStyles = {
    default: {
      icon: 'text-blue-500',
      iconBg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
      button: isDark
        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md',
    },
    danger: {
      icon: 'text-red-500',
      iconBg: isDark ? 'bg-red-500/10' : 'bg-red-50',
      button: isDark
        ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20'
        : 'bg-red-600 hover:bg-red-700 text-white shadow-md',
    },
    warning: {
      icon: 'text-orange-500',
      iconBg: isDark ? 'bg-orange-500/10' : 'bg-orange-50',
      button: isDark
        ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20'
        : 'bg-orange-600 hover:bg-orange-700 text-white shadow-md',
    },
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md ${isDark ? 'bg-gray-900' : 'bg-white'} rounded-3xl shadow-2xl z-50 border ${isDark ? 'border-white/10' : 'border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className={`p-3 rounded-xl ${styles.iconBg}`}>
                  <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
                </div>
                <div className="flex-1">
                  <h2 className={`text-xl font-bold ${text} mb-1`}>{title}</h2>
                  <p className={`text-sm ${mutedText}`}>{message}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  disabled={isLoading}
                  className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-600'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="flex items-center justify-end gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  onClick={onClose}
                  disabled={isLoading}
                  className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${isDark ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  type="button"
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} ${styles.button}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    confirmText
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

