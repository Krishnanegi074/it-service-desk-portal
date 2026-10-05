export interface DiagnosticSlot {
  key: string;
  label: string;
  question: string;
  required: boolean;
}

export interface Playbook {
  category: string;
  slots: DiagnosticSlot[];
}

export const PLAYBOOKS: Record<string, Playbook> = {
  vpn: {
    category: 'Network / VPN',
    slots: [
      { key: 'operatingSystem', label: 'Operating System', question: 'Which operating system are you using (macOS, Windows, Linux)?', required: true },
      { key: 'networkType', label: 'Network Environment', question: 'Are you connected via Home Wi-Fi, Office Ethernet, or Mobile Hotspot?', required: true },
      { key: 'errorCode', label: 'Error Code/Message', question: 'What exact error string or alert does the VPN client display?', required: true }
    ]
  },
  sso: {
    category: 'Identity / SSO',
    slots: [
      { key: 'affectedApp', label: 'Target Service', question: 'Which application or portal are you unable to sign into?', required: true },
      { key: 'errorCode', label: 'HTTP / Auth Error', question: 'Are you seeing a 403 Forbidden, expired session, or MFA challenge failure?', required: true }
    ]
  }
};

export function getNextMissingQuestion(categoryKey: string, collectedSlots: Record<string, string>): string | null {
  const playbook = PLAYBOOKS[categoryKey];
  if (!playbook) return null;

  for (const slot of playbook.slots) {
    if (slot.required && (!collectedSlots[slot.key] || collectedSlots[slot.key].trim() === '')) {
      return slot.question;
    }
  }
  return null;
}
