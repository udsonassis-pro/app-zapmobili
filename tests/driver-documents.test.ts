import { describe, expect, it } from "vitest";
import {
  reviewDriverDocumentSchema,
  submitDriverDocumentSchema,
} from "@/server/drivers/document-schemas";

describe("driver documents schemas", () => {
  it("aceita envio de documento valido", () => {
    const parsed = submitDriverDocumentSchema.parse({
      type: "CNH",
      fileUrl: "https://example.com/cnh.pdf",
    });

    expect(parsed.type).toBe("CNH");
  });

  it("rejeita URL invalida", () => {
    const parsed = submitDriverDocumentSchema.safeParse({
      type: "CNH",
      fileUrl: "arquivo-local.pdf",
    });

    expect(parsed.success).toBe(false);
  });

  it("aceita decisao de revisao", () => {
    expect(reviewDriverDocumentSchema.parse({ decision: "APPROVE" })).toEqual({
      decision: "APPROVE",
    });
  });
});
