/** Public marketing-site settings. Change contact details here in one place. */
export const siteConfig = {
  name: 'Triage Portal',
  tagline: 'A better front door for internal IT.',
  githubUrl: 'https://github.com/Krishnanegi074/it-service-desk-portal',
  roadmapUrl: 'https://github.com/Krishnanegi074/it-service-desk-portal/blob/main/ROADMAP.md',
  requestPlaybookUrl: 'https://github.com/Krishnanegi074/it-service-desk-portal/issues/new',
  contactEmail: 'krishnanegi074@gmail.com',
  /** Early-access prices in USD. Validate with pilot teams before general release. */
  pricing: { teamMonthly: 149, teamYearlyPerMonth: 124, teamYearlyTotal: 1490, setupFrom: 1500 }
} as const;

export function mailto(subject: string) {
  return `mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(subject)}`;
}
