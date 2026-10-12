'use client';

import { useEffect, useRef } from 'react';
import IncidentIntakeForm from '@/components/IncidentIntakeForm';

interface PreTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIncidentCreated: () => void | Promise<void>;
  currentUser: { fullName: string; email: string };
}

export default function PreTriageModal({ isOpen, onClose, onIncidentCreated, currentUser }: PreTriageModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusableElements = () => Array.from(dialog?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    focusableElements()[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusableElements();
      if (elements.length === 0) {
        event.preventDefault();
        dialog?.focus();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="incident-intake-title"
        tabIndex={-1}
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 shadow-2xl"
      >
        <IncidentIntakeForm
          initialReporter={currentUser}
          onCancel={onClose}
          onSuccess={async () => {
            await onIncidentCreated();
            onClose();
          }}
        />
      </div>
    </div>
  );
}
