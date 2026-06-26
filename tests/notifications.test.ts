import { describe, expect, it } from "vitest";
import {
  buildRideNotificationMetadata,
  getNotificationTarget,
} from "@/server/notifications/metadata";

describe("in-app notifications", () => {
  it("monta metadados de corrida para navegacao e auditoria", () => {
    expect(
      buildRideNotificationMetadata({
        rideId: "ride_123",
        status: "DRIVER_ASSIGNED",
        event: "RIDE_ASSIGNED_PASSENGER",
      }),
    ).toEqual({
      rideId: "ride_123",
      status: "DRIVER_ASSIGNED",
      event: "RIDE_ASSIGNED_PASSENGER",
    });
  });

  it("aponta notificacao operacional para detalhes da corrida", () => {
    expect(
      getNotificationTarget(
        buildRideNotificationMetadata({
          rideId: "ride_123",
          status: "DRIVER_ASSIGNED",
          event: "RIDE_ASSIGNED_DRIVER",
        }),
        { roles: ["OPERATOR"], tenantSlug: "demo" },
      ),
    ).toEqual({
      href: "/t/demo/rides/ride_123",
      label: "Ver corrida",
    });
  });

  it("aponta notificacao de motorista para o painel do motorista", () => {
    expect(
      getNotificationTarget(
        buildRideNotificationMetadata({
          rideId: "ride_123",
          status: "DRIVER_ASSIGNED",
          event: "RIDE_ACCEPTED_DRIVER",
        }),
        { roles: ["DRIVER"] },
      ),
    ).toEqual({
      href: "/rides/ride_123",
      label: "Ver corrida",
    });
  });

  it("aponta notificacao de passageiro para a area de solicitacao", () => {
    expect(
      getNotificationTarget(
        buildRideNotificationMetadata({
          rideId: "ride_123",
          status: "SEARCHING_DRIVER",
          event: "RIDE_CREATED",
        }),
        { roles: ["PASSENGER"] },
      ),
    ).toEqual({
      href: "/rides/ride_123",
      label: "Ver corrida",
    });
  });

  it("aponta alerta de suporte para o painel de suporte do tenant", () => {
    expect(
      getNotificationTarget(
        {
          ticketId: "ticket_123",
          event: "SUPPORT_SLA_OVERDUE",
        },
        { roles: ["SUPPORT"], tenantSlug: "demo" },
      ),
    ).toEqual({
      href: "/t/demo/support",
      label: "Ver suporte",
    });
  });
});
