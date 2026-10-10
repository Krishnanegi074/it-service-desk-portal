import { z } from 'zod';

export const PriorityLevelSchema = z.enum(['P1', 'P2', 'P3', 'P4']);
export const IncidentStatusSchema = z.enum(['open', 'in_triage', 'dispatched', 'resolved']);
export const IncidentEventTypeSchema = z.enum([
  'created',
  'status_changed',
  'assigned',
  'note_added',
  'delivery_attempted'
]);

export const IncidentPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).optional().default(''),
  status: IncidentStatusSchema.optional(),
  priority: PriorityLevelSchema.optional(),
  assigneeId: z.string().uuid().optional()
});

export const AppUserSummarySchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  role: z.enum(['engineer', 'admin'])
});

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
  assignedTo: AppUserSummarySchema.nullable().optional(),
  status: IncidentStatusSchema.default('open'),
  readinessScore: z.number().min(0).max(100),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional()
});

export const IncidentEventSchema = z.object({
  id: z.string().uuid(),
  incidentId: z.string().uuid(),
  eventType: IncidentEventTypeSchema,
  fromStatus: IncidentStatusSchema.nullable(),
  toStatus: IncidentStatusSchema.nullable(),
  metadata: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime()
});

export const IncidentNoteSchema = z.object({
  note: z.string().trim().min(2).max(2000)
});

export const IncidentAssignmentSchema = z.object({
  assigneeId: z.string().uuid().nullable()
});

export const IntegrationDeliverySchema = z.object({
  id: z.string().uuid(),
  incidentId: z.string().uuid(),
  provider: z.string(),
  externalId: z.string().nullable(),
  externalUrl: z.string().url().nullable(),
  status: z.enum(['pending', 'delivered', 'failed']),
  attemptCount: z.number().int().min(0),
  lastError: z.string().nullable(),
  updatedAt: z.string().datetime()
});

export const PilotFeedbackInputSchema = z.object({
  routingAccurate: z.boolean(),
  clarificationCount: z.coerce.number().int().min(0).max(20)
});

export const PilotFeedbackSchema = PilotFeedbackInputSchema.extend({
  incidentId: z.string().uuid(),
  updatedAt: z.string().datetime()
});

export const IntakeSessionActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('start'),
    sessionId: z.string().uuid()
  }),
  z.object({
    action: z.literal('complete'),
    sessionId: z.string().uuid(),
    incidentId: z.string().uuid()
  })
]);

export type IncidentPayload = z.infer<typeof IncidentPayloadSchema>;
export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;
export type IncidentEvent = z.infer<typeof IncidentEventSchema>;
export type IncidentEventType = z.infer<typeof IncidentEventTypeSchema>;
export type IncidentPagination = z.infer<typeof IncidentPaginationSchema>;
export type AppUserSummary = z.infer<typeof AppUserSummarySchema>;
export type IntegrationDelivery = z.infer<typeof IntegrationDeliverySchema>;
export type PilotFeedbackInput = z.infer<typeof PilotFeedbackInputSchema>;
export type PilotFeedback = z.infer<typeof PilotFeedbackSchema>;
