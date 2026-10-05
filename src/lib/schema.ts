import { z } from 'zod';

export const PriorityLevelSchema = z.enum(['P1', 'P2', 'P3', 'P4']);

export const ReporterSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  department: z.string().optional()
});

export const TechnicalContextSchema = z.object({
  operatingSystem: z.enum(['macOS', 'Windows', 'Linux', 'iOS', 'Android', 'Other']),
  networkType: z.string().min(2),
  errorCode: z.string().optional(),
  affectedApp: z.string().min(2),
  attemptedWorkarounds: z.array(z.string()).default([])
});

export const IncidentPayloadSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(5),
  summary: z.string().min(10),
  category: z.string(),
  urgency: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  impact: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  priority: PriorityLevelSchema,
  reporter: ReporterSchema,
  technicalContext: TechnicalContextSchema,
  status: z.enum(['open', 'in_triage', 'dispatched', 'resolved']).default('open'),
  readinessScore: z.number().min(0).max(100)
});

export type IncidentPayload = z.infer<typeof IncidentPayloadSchema>;
