import { z } from "zod";

export const submitDriverDocumentSchema = z.object({
  type: z.string().min(2).max(80),
  fileUrl: z.string().url(),
  expiresAt: z.string().datetime().optional(),
});

export const reviewDriverDocumentSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().max(500).optional(),
});

export type SubmitDriverDocumentInput = z.infer<
  typeof submitDriverDocumentSchema
>;
export type ReviewDriverDocumentInput = z.infer<
  typeof reviewDriverDocumentSchema
>;
