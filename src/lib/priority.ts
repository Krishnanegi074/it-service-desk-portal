export type Urgency = 1 | 2 | 3 | 4; // 1: Critical -> 4: Low
export type Impact = 1 | 2 | 3 | 4;  // 1: Department/Enterprise -> 4: Individual

export type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4';

export interface PriorityEvaluation {
  priority: PriorityLevel;
  urgency: Urgency;
  impact: Impact;
  attribution: string;
}

/**
 * Standard ITIL 4x4 Impact vs Urgency Matrix
 * Deterministic business logic — no probabilistic LLM guessing.
 */
const ITIL_MATRIX: Record<Urgency, Record<Impact, PriorityLevel>> = {
  1: { 1: 'P1', 2: 'P1', 3: 'P2', 4: 'P3' },
  2: { 1: 'P1', 2: 'P2', 3: 'P3', 4: 'P4' },
  3: { 1: 'P2', 2: 'P3', 3: 'P4', 4: 'P4' },
  4: { 1: 'P3', 2: 'P4', 3: 'P4', 4: 'P4' }
};

export function evaluateITILPriority(urgency: Urgency, impact: Impact): PriorityEvaluation {
  const priority = ITIL_MATRIX[urgency][impact];
  const attribution = `ITIL Matrix Decision: Urgency=${urgency} × Impact=${impact} -> ${priority}`;

  return {
    priority,
    urgency,
    impact,
    attribution
  };
}
