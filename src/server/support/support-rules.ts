import { z } from "zod";

export const supportTicketStatuses = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;

export const createRideSupportTicketSchema = z.object({
  subject: z.string().min(5).max(120),
  description: z.string().min(10).max(1000),
  priority: z.number().int().min(1).max(4).default(2),
});

export const updateSupportTicketSchema = z.object({
  status: z.enum(supportTicketStatuses).optional(),
  priority: z.number().int().min(1).max(4).optional(),
  note: z.string().max(800).optional(),
});

export type CreateRideSupportTicketInput = z.infer<
  typeof createRideSupportTicketSchema
>;
export type UpdateSupportTicketInput = z.infer<typeof updateSupportTicketSchema>;

export function getSupportPriorityLabel(priority: number) {
  const labels: Record<number, string> = {
    1: "Baixa",
    2: "Normal",
    3: "Alta",
    4: "Critica",
  };

  return labels[priority] ?? "Normal";
}

export function getSupportSlaHours(priority: number) {
  const hours: Record<number, number> = {
    1: 48,
    2: 24,
    3: 8,
    4: 2,
  };

  return hours[priority] ?? hours[2];
}

export function getSupportSlaStatus(input: {
  priority: number;
  status: string;
  createdAt: Date;
  now?: Date;
}) {
  const dueAt = new Date(
    input.createdAt.getTime() + getSupportSlaHours(input.priority) * 60 * 60 * 1000,
  );
  const closed = ["RESOLVED", "CLOSED"].includes(input.status);
  const reference = input.now ?? new Date();
  const overdue = !closed && reference.getTime() > dueAt.getTime();
  const remainingMs = dueAt.getTime() - reference.getTime();

  return {
    dueAt,
    overdue,
    closed,
    remainingHours: Math.ceil(remainingMs / (60 * 60 * 1000)),
  };
}

export function getSupportSlaAlertType(input: {
  priority: number;
  status: string;
  createdAt: Date;
  now?: Date;
  dueSoonHours?: number;
}) {
  const sla = getSupportSlaStatus(input);

  if (sla.closed) {
    return null;
  }

  if (sla.overdue) {
    return "SUPPORT_SLA_OVERDUE";
  }

  const dueSoonHours = input.dueSoonHours ?? 1;

  if (sla.remainingHours <= dueSoonHours) {
    return "SUPPORT_SLA_DUE_SOON";
  }

  return null;
}
