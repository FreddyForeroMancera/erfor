import { describe, expect, it } from "vitest";
import { extractRequirementText } from "@/lib/automations";

describe("extractRequirementText", () => {
  it("extracts CAR requirement metadata from plain text", () => {
    const result = extractRequirementText(
      "Entidad: CAR Cundinamarca. Radicado: CAR-REQ-2026-0901. Asunto: Permiso de vertimientos. Fecha limite 2026-05-25. Solicita caracterización y plano."
    );

    expect(result.entity).toBe("CAR Cundinamarca");
    expect(result.filingNumber).toBe("CAR-REQ-2026-0901");
    expect(result.subject).toContain("Permiso de vertimientos");
    expect(result.requestedDocuments).toContain("caracterización");
    expect(result.requestedDocuments).toContain("plano");

    // Verificar que la fecha se interprete localmente sin desfase UTC de un día
    expect(result.dueDate.getFullYear()).toBe(2026);
    expect(result.dueDate.getMonth()).toBe(4); // Mayo es 4 en indexación 0
    expect(result.dueDate.getDate()).toBe(25);
  });
});
