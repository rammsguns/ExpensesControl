import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Friendly error message component replacing generic red divs.
 * Uses rose-50 background with rose-600 text and AlertCircle icon.
 */
export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm flex items-start gap-3" role="alert" aria-live="polite">
      <AlertCircle size={20} className="text-rose-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div className="flex-1">
        <p>{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-medium text-rose-600 hover:text-rose-800 underline transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}