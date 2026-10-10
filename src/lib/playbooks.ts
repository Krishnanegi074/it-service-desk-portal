export interface DiagnosticSlot {
  key: string;
  label: string;
  question: string;
  placeholder: string;
  required: boolean;
  control?: 'text' | 'operating-system';
}

export interface Playbook {
  category: string;
  description: string;
  affectedAppFallback: string;
  slots: DiagnosticSlot[];
}

export const PLAYBOOKS: Record<string, Playbook> = {
  vpn: {
    category: 'Network / VPN',
    description: 'Connection failures, dropped sessions, office network, or remote access.',
    affectedAppFallback: 'Corporate VPN',
    slots: [
      {
        key: 'operatingSystem',
        label: 'Operating system',
        question: 'Which operating system are you using?',
        placeholder: '',
        required: true,
        control: 'operating-system'
      },
      {
        key: 'networkType',
        label: 'Network environment',
        question: 'Are you connected through home Wi-Fi, office Ethernet, or a mobile hotspot?',
        placeholder: 'For example, home Wi-Fi',
        required: true
      },
      {
        key: 'errorCode',
        label: 'Error message',
        question: 'What exact error message does the VPN display?',
        placeholder: 'Copy the complete error message',
        required: true
      }
    ]
  },
  email: {
    category: 'Email',
    description: 'Sending, receiving, mailbox access, Outlook, or mobile mail problems.',
    affectedAppFallback: 'Corporate email',
    slots: [
      {
        key: 'operatingSystem',
        label: 'Operating system',
        question: 'Which operating system are you using?',
        placeholder: '',
        required: true,
        control: 'operating-system'
      },
      {
        key: 'affectedApp',
        label: 'Email application',
        question: 'Which email application is affected?',
        placeholder: 'For example, Outlook desktop or Gmail web',
        required: true
      },
      {
        key: 'errorCode',
        label: 'Error or behavior',
        question: 'What error or unexpected behavior do you see?',
        placeholder: 'For example, messages remain in the outbox',
        required: true
      }
    ]
  },
  sso: {
    category: 'Identity / SSO',
    description: 'Sign-in, MFA, access denied, expired session, or account lockout.',
    affectedAppFallback: 'Identity provider',
    slots: [
      {
        key: 'affectedApp',
        label: 'Application or service',
        question: 'Which application or service are you unable to access?',
        placeholder: 'For example, Salesforce or employee portal',
        required: true
      },
      {
        key: 'errorCode',
        label: 'Authentication error',
        question: 'What sign-in or MFA error do you see?',
        placeholder: 'For example, access denied or MFA challenge failed',
        required: true
      }
    ]
  },
  application: {
    category: 'Application',
    description: 'Crashes, freezes, unexpected behavior, or application startup failures.',
    affectedAppFallback: 'Business application',
    slots: [
      {
        key: 'operatingSystem',
        label: 'Operating system',
        question: 'Which operating system are you using?',
        placeholder: '',
        required: true,
        control: 'operating-system'
      },
      {
        key: 'affectedApp',
        label: 'Application name',
        question: 'Which application is affected?',
        placeholder: 'Include the application name and version if known',
        required: true
      },
      {
        key: 'errorCode',
        label: 'Error or behavior',
        question: 'What error or unexpected behavior occurs?',
        placeholder: 'Describe the crash, freeze, or displayed error',
        required: true
      }
    ]
  },
  hardware: {
    category: 'Hardware / Device',
    description: 'Laptop, monitor, keyboard, battery, printer, or peripheral failures.',
    affectedAppFallback: 'Employee device',
    slots: [
      {
        key: 'operatingSystem',
        label: 'Operating system',
        question: 'Which operating system does the affected device use?',
        placeholder: '',
        required: true,
        control: 'operating-system'
      },
      {
        key: 'affectedApp',
        label: 'Device type',
        question: 'Which device or component is affected?',
        placeholder: 'For example, laptop battery or external monitor',
        required: true
      },
      {
        key: 'errorCode',
        label: 'Observed symptom',
        question: 'What exactly is the device doing?',
        placeholder: 'For example, does not power on or flickers intermittently',
        required: true
      }
    ]
  }
};

export function createInitialSlots(categoryKey: string): Record<string, string> {
  const playbook = PLAYBOOKS[categoryKey];
  if (!playbook) return {};

  return Object.fromEntries(
    playbook.slots.map(slot => [
      slot.key,
      slot.control === 'operating-system' ? 'macOS' : ''
    ])
  );
}

export function getNextMissingQuestion(
  categoryKey: string,
  collectedSlots: Record<string, string>
): string | null {
  const playbook = PLAYBOOKS[categoryKey];
  if (!playbook) return null;

  for (const slot of playbook.slots) {
    if (slot.required && (!collectedSlots[slot.key] || collectedSlots[slot.key].trim() === '')) {
      return slot.question;
    }
  }
  return null;
}
