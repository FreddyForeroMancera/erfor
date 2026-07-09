import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import { buildWhere, schemas } from "@/lib/crud";
import { statusSchema } from "@/lib/expediente-status";
import { canDelete, canWrite } from "@/lib/auth";

describe("buildWhere - field whitelist", () => {
  it("keeps query params that are real fields of the resource schema", () => {
    const params = new URLSearchParams({ status: "APPROVED" });
    const where = buildWhere(params, [], schemas.environmentalFiles);

    expect(where).toEqual({ status: "APPROVED" });
  });

  it("drops query params that are not part of the resource schema", () => {
    const params = new URLSearchParams({
      status: "APPROVED",
      role: "SUPER_ADMIN",
      passwordHash: "whatever"
    });
    const where = buildWhere(params, [], schemas.environmentalFiles);

    expect(where).toEqual({ status: "APPROVED" });
    expect(where).not.toHaveProperty("role");
    expect(where).not.toHaveProperty("passwordHash");
  });

  it("still ignores q/page/limit as before", () => {
    const params = new URLSearchParams({ q: "car", page: "2", limit: "10" });
    const where = buildWhere(params, ["internalCode"], schemas.environmentalFiles);

    expect(where).toEqual({ OR: [{ internalCode: { contains: "car", mode: "insensitive" } }] });
  });
});

describe("canWrite / canDelete - role permission matrix", () => {
  const allRoles = Object.values(Role);

  it("canWrite excludes only AUDITOR and CLIENTE_EXTERNO", () => {
    const writers = allRoles.filter((role) => canWrite(role));
    expect(writers.sort()).toEqual(
      [Role.SUPER_ADMIN, Role.DIRECTOR_AMBIENTAL, Role.CONSULTOR_AMBIENTAL, Role.ASISTENTE_ADMINISTRATIVO].sort()
    );
  });

  it("canDelete only allows SUPER_ADMIN and DIRECTOR_AMBIENTAL", () => {
    const deleters = allRoles.filter((role) => canDelete(role));
    expect(deleters.sort()).toEqual([Role.SUPER_ADMIN, Role.DIRECTOR_AMBIENTAL].sort());
  });

  it("every role that can delete can also write (canDelete implies canWrite)", () => {
    for (const role of allRoles) {
      if (canDelete(role)) expect(canWrite(role)).toBe(true);
    }
  });
});

describe("statusSchema - EnvironmentalFile status validation", () => {
  it("accepts a valid WorkStatus value", () => {
    const result = statusSchema.safeParse({ status: "APPROVED" });
    expect(result.success).toBe(true);
  });

  it("rejects a status value outside the WorkStatus enum", () => {
    const result = statusSchema.safeParse({ status: "NOT_A_REAL_STATUS" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing status", () => {
    const result = statusSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
