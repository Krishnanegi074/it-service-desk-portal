/** Public playbook catalogue shown on /playbooks. "included" entries mirror src/lib/playbooks.ts. */
export type PlaybookStatus = 'included' | 'soon' | 'pack';

export interface CatalogPlaybook {
  name: string;
  category: string;
  status: PlaybookStatus;
  description: string;
  questions: string[];
  example: string;
  priorityRange: string;
}

export const PLAYBOOK_CATALOG: CatalogPlaybook[] = [
  {
    "name": "VPN",
    "category": "Network",
    "status": "included",
    "description": "Drops, failed sign-in and slow connections on the company VPN.",
    "questions": [
      "Which operating system are you using?",
      "Are you on home Wi‑Fi, office Ethernet, or a mobile hotspot?",
      "What exact error message does the VPN display?"
    ],
    "example": "macOS · Home Wi‑Fi · AUTH_TIMEOUT",
    "priorityRange": "P1–P4"
  },
  {
    "name": "Email",
    "category": "Messaging",
    "status": "included",
    "description": "Mail not syncing, search failing, or messages stuck in the outbox.",
    "questions": [
      "Which operating system are you using?",
      "Which email application is affected?",
      "What error or unexpected behaviour do you see?"
    ],
    "example": "Windows 11 · Outlook · 0x800CCC0E",
    "priorityRange": "P1–P4"
  },
  {
    "name": "SSO & MFA",
    "category": "Identity",
    "status": "included",
    "description": "Can’t sign in to a company app, or the second sign-in step fails.",
    "questions": [
      "Which application or service can’t you get into?",
      "What sign-in or MFA error do you see?"
    ],
    "example": "Salesforce · AADSTS50076",
    "priorityRange": "P1–P3"
  },
  {
    "name": "Applications",
    "category": "Software",
    "status": "included",
    "description": "An app crashes, freezes or shows an error.",
    "questions": [
      "Which operating system are you using?",
      "Which application is affected?",
      "What error or unexpected behaviour happens?"
    ],
    "example": "macOS · Zoom · code 5003",
    "priorityRange": "P2–P4"
  },
  {
    "name": "Hardware",
    "category": "Device",
    "status": "included",
    "description": "Laptops, docks, monitors and other kit that won’t behave.",
    "questions": [
      "Which operating system does the device use?",
      "Which device or component is affected?",
      "What exactly is the device doing?"
    ],
    "example": "Windows 11 · USB‑C dock · no display",
    "priorityRange": "P2–P4"
  },
  {
    "name": "Office Wi‑Fi",
    "category": "Network",
    "status": "soon",
    "description": "Weak signal, can’t join, or keeps dropping in the office.",
    "questions": [
      "Which floor or meeting room are you in?",
      "Which network name are you trying to join?",
      "Are colleagues near you affected too?"
    ],
    "example": "3rd floor · Corp‑Secure · whole floor",
    "priorityRange": "P1–P3"
  },
  {
    "name": "Account lockout",
    "category": "Identity",
    "status": "soon",
    "description": "Locked out or need a reset. Never asks for the old password.",
    "questions": [
      "Which account is locked: computer, email or an app?",
      "When did you last sign in successfully?",
      "Do you still have your MFA device?"
    ],
    "example": "Laptop sign-in · yesterday · MFA available",
    "priorityRange": "P2–P3"
  },
  {
    "name": "Shared drives & access",
    "category": "Access",
    "status": "soon",
    "description": "Can’t open a folder, or need access to a team space.",
    "questions": [
      "Which drive, folder or site is it?",
      "Do you need to view or edit?",
      "Who owns or approves access?"
    ],
    "example": "Finance / Q4 close · edit · approver: team lead",
    "priorityRange": "P3–P4"
  },
  {
    "name": "Printing & scanning",
    "category": "Device",
    "status": "soon",
    "description": "Jobs stuck in the queue, offline printers, scan-to-email failing.",
    "questions": [
      "Which printer, by name or location?",
      "What happens when you print?",
      "Is it every document or one file?"
    ],
    "example": "HP‑2F‑East · stuck in queue · every job",
    "priorityRange": "P3–P4"
  },
  {
    "name": "Video calls",
    "category": "Software",
    "status": "soon",
    "description": "Camera, mic or screen sharing not working in Zoom, Teams or Meet.",
    "questions": [
      "Which calling app are you using?",
      "Is it camera, microphone, speaker or screen share?",
      "Does it fail in every call or one meeting?"
    ],
    "example": "Teams · microphone · every call",
    "priorityRange": "P2–P4"
  },
  {
    "name": "New joiner setup",
    "category": "Onboarding",
    "status": "soon",
    "description": "Everything a new starter needs on day one, checked in one request.",
    "questions": [
      "What is the start date?",
      "Which team and role are they joining?",
      "Laptop type and apps they need?"
    ],
    "example": "Starts 3 Nov · Design · MacBook, Figma, Slack",
    "priorityRange": "P3"
  },
  {
    "name": "Phone & mobile email",
    "category": "Device",
    "status": "soon",
    "description": "Company email or apps not working on a phone.",
    "questions": [
      "iPhone or Android?",
      "Company-owned or personal phone?",
      "What error or behaviour do you see?"
    ],
    "example": "iPhone · personal · mail asks for password",
    "priorityRange": "P3–P4"
  },
  {
    "name": "Retail store & POS",
    "category": "Industry",
    "status": "pack",
    "description": "Tills, card readers and store Wi‑Fi, with store-hours urgency.",
    "questions": [
      "Store number?",
      "Which till or card reader?",
      "Can the store still take payments?"
    ],
    "example": "Store 112 · till 3 · cannot take cards",
    "priorityRange": "P1–P2"
  },
  {
    "name": "Clinics",
    "category": "Industry",
    "status": "pack",
    "description": "Clinical apps, label printers and shared workstations.",
    "questions": [
      "Which site and room?",
      "Which system is affected?",
      "Are appointments being delayed?"
    ],
    "example": "Site B · room 4 · patient records app",
    "priorityRange": "P1–P3"
  },
  {
    "name": "Agencies & studios",
    "category": "Industry",
    "status": "pack",
    "description": "Creative apps, licences, render machines and large file transfers.",
    "questions": [
      "Which creative app or licence?",
      "Is a client deadline at risk?",
      "File size and where it’s stored?"
    ],
    "example": "Adobe licence · deadline today · 40 GB",
    "priorityRange": "P2–P3"
  },
  {
    "name": "Finance month-end",
    "category": "Industry",
    "status": "pack",
    "description": "Accounting systems and reports during the close, when every hour counts.",
    "questions": [
      "Which finance system?",
      "Is this blocking the close?",
      "Which report or step fails?"
    ],
    "example": "NetSuite · blocking close · bank reconciliation",
    "priorityRange": "P1–P2"
  }
];
