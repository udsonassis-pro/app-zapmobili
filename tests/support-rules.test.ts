import { describe, expect, it } from "vitest";
import {
  createRideSupportTicketSchema,
  getSupportPriorityLabel,
  getSupportSlaAlertType,
  getSupportSlaHours,
  getSupportSlaStatus,
  updateSupportTicketSchema,
} from "@/server/support/support-rules";

describe("support rules", () => {
  it("valida abertura de chamado vinculado a corrida", () => {
    const parsed = createRideSupportTicketSchema.parse({
      subject: "Problema no embarque",
      description: "Passageiro informou divergencia no ponto de encontro.",
      priority: 3,
    });

    expect(parsed.priority).toBe(3);
  });

  it("aplica prioridade normal por padrao", () => {
    const parsed = createRideSupportTicketSchema.parse({
      subject: "Duvida na corrida",
      description: "Solicitante pediu acompanhamento da operacao.",
    });

    expect(parsed.priority).toBe(2);
  });

  it("valida status operacional do chamado", () => {
    expect(updateSupportTicketSchema.parse({ status: "IN_PROGRESS" })).toEqual({
      status: "IN_PROGRESS",
    });
    expect(() => updateSupportTicketSchema.parse({ status: "INVALIDO" })).toThrow();
  });

  it("nomeia prioridades", () => {
    expect(getSupportPriorityLabel(1)).toBe("Baixa");
    expect(getSupportPriorityLabel(4)).toBe("Critica");
  });

  it("define prazos de SLA por prioridade", () => {
    expect(getSupportSlaHours(1)).toBe(48);
    expect(getSupportSlaHours(4)).toBe(2);
  });

  it("marca chamado ativo como vencido apos o prazo", () => {
    const createdAt = new Date("2026-06-26T00:00:00.000Z");
    const sla = getSupportSlaStatus({
      priority: 4,
      status: "OPEN",
      createdAt,
      now: new Date("2026-06-26T03:00:00.000Z"),
    });

    expect(sla.overdue).toBe(true);
    expect(sla.dueAt.toISOString()).toBe("2026-06-26T02:00:00.000Z");
  });

  it("nao marca chamado resolvido como vencido", () => {
    const sla = getSupportSlaStatus({
      priority: 4,
      status: "RESOLVED",
      createdAt: new Date("2026-06-26T00:00:00.000Z"),
      now: new Date("2026-06-26T03:00:00.000Z"),
    });

    expect(sla.overdue).toBe(false);
    expect(sla.closed).toBe(true);
  });

  it("classifica alerta de SLA proximo do vencimento", () => {
    expect(
      getSupportSlaAlertType({
        priority: 4,
        status: "OPEN",
        createdAt: new Date("2026-06-26T00:00:00.000Z"),
        now: new Date("2026-06-26T01:15:00.000Z"),
      }),
    ).toBe("SUPPORT_SLA_DUE_SOON");
  });

  it("classifica alerta de SLA vencido", () => {
    expect(
      getSupportSlaAlertType({
        priority: 4,
        status: "OPEN",
        createdAt: new Date("2026-06-26T00:00:00.000Z"),
        now: new Date("2026-06-26T03:00:00.000Z"),
      }),
    ).toBe("SUPPORT_SLA_OVERDUE");
  });
});
