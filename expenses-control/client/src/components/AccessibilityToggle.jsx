import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { Eye, Type, Zap, X } from 'lucide-react';

export default function AccessibilityToggle() {
  const { highContrast, setHighContrast, largeText, setLargeText, reducedMotion, setReducedMotion } = useAccessibility();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-150 focus-ring"
        aria-label="Accessibility settings"
        aria-expanded={open}
      >
        <Eye size={22} aria-hidden="true" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-lg border border-slate-200 p-5 z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Accessibility</h3>
              <button
                onClick={() => setOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors focus-ring"
                aria-label="Close accessibility menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Eye size={20} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">High Contrast</p>
                    <p className="text-slate-500 text-xs">Black/yellow theme</p>
                  </div>
                </div>
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${highContrast ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  role="switch"
                  aria-checked={highContrast}
                  aria-label="Toggle high contrast mode"
                >
                  <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${highContrast ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {/* Large Text */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Type size={20} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Large Text</p>
                    <p className="text-slate-500 text-xs">Increase font size</p>
                  </div>
                </div>
                <button
                  onClick={() => setLargeText(!largeText)}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${largeText ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  role="switch"
                  aria-checked={largeText}
                  aria-label="Toggle large text mode"
                >
                  <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${largeText ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Zap size={20} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Reduced Motion</p>
                    <p className="text-slate-500 text-xs">Disable animations</p>
                  </div>
                </div>
                <button
                  onClick={() => setReducedMotion(!reducedMotion)}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${reducedMotion ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  role="switch"
                  aria-checked={reducedMotion}
                  aria-label="Toggle reduced motion mode"
                >
                  <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${reducedMotion ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
