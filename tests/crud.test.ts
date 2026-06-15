import { describe, expect, it } from "vitest";
import { schemas } from "@/lib/crud";

describe("schemas.projects - optionalDate behavior", () => {
  it("keeps a valid ISO string as a Date object", () => {
    const result = schemas.projects.partial().safeParse({
      startDate: "2026-05-29T10:00:00Z"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBeInstanceOf(Date);
      expect(result.data.startDate?.toISOString()).toBe("2026-05-29T10:00:00.000Z");
    }
  });

  it("transforms empty string to null to allow clearing the field in Prisma", () => {
    const result = schemas.projects.partial().safeParse({
      startDate: ""
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBe(null);
    }
  });

  it("transforms null to null to allow clearing the field in Prisma", () => {
    const result = schemas.projects.partial().safeParse({
      startDate: null
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBe(null);
    }
  });

  it("leaves undefined as undefined so Prisma does not overwrite it", () => {
    const result = schemas.projects.partial().safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startDate).toBe(undefined);
    }
  });
});
