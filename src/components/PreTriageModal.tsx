'use client';

import IncidentIntakeForm from '@/components/IncidentIntakeForm';

interface PreTriageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIncidentCreated: () => void | Promise<void>;
  currentUser: { fullName: string; email: string };
}

export default function PreTriageModal({ isOpen, onClose, onIncidentCreated, currentUser }: PreTriageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 shadow-2xl">
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
