import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const prismaMock = {
  property: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  environmentalFile: {
    update: vi.fn()
  },
  client: {
    findUnique: vi.fn(),
    update: vi.fn()
  }
};

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

const { buildExtractionPrompt, applyExtractedProperty, parseClientDataCsv, extractPropertyFromText } = await import(
  "@/lib/ai-extract-property"
);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildExtractionPrompt", () => {
  it("pide representante legal y dirección además de los campos originales del predio", () => {
    const prompt = buildExtractionPrompt("texto de un documento cualquiera");

    expect(prompt).toContain('"representative"');
    expect(prompt).toContain('"address"');
    expect(prompt).toContain('"name"');
    expect(prompt).toContain('"owner"');
  });

  it("incluye el texto del documento en el prompt", () => {
    const prompt = buildExtractionPrompt("PREDIO Hacienda La Esperanza");
    expect(prompt).toContain("PREDIO Hacienda La Esperanza");
  });
});

describe("applyExtractedProperty", () => {
  const expediente = { id: "exp-1", clientId: "client-1", propertyId: null, type: "Desconocido" };

  it("no hace nada si el expediente ya tiene un predio asociado", async () => {
    const result = await applyExtractedProperty(
      { ...expediente, propertyId: "existing-property" },
      { name: "Hacienda La Esperanza" }
    );

    expect(result).toBeNull();
    expect(prismaMock.property.findFirst).not.toHaveBeenCalled();
  });

  it("no hace nada si la IA no devolvió un nombre de predio", async () => {
    const result = await applyExtractedProperty(expediente, { name: null });
    expect(result).toBeNull();
    expect(prismaMock.property.findFirst).not.toHaveBeenCalled();
  });

  it("crea el predio con todos los campos extraídos cuando no existe uno con ese nombre", async () => {
    prismaMock.property.findFirst.mockResolvedValue(null);
    prismaMock.property.create.mockResolvedValue({ id: "prop-1", name: "Hacienda La Esperanza" });
    prismaMock.client.findUnique.mockResolvedValue({ id: "client-1", representative: null });

    await applyExtractedProperty(expediente, {
      name: "Hacienda La Esperanza",
      owner: "Juan Pérez",
      address: "Calle 10 # 5-20",
      representative: "Juan Carlos Pérez"
    });

    expect(prismaMock.property.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Hacienda La Esperanza",
        owner: "Juan Pérez",
        address: "Calle 10 # 5-20"
      })
    });
  });

  it("solo llena campos vacíos de un predio existente, sin sobreescribir los ya cargados a mano", async () => {
    prismaMock.property.findFirst.mockResolvedValue({
      id: "prop-1",
      owner: "Propietario Cargado Manualmente",
      address: null,
      cadastralCode: null,
      realEstateRegistration: null,
      city: null,
      village: null
    });
    prismaMock.property.update.mockResolvedValue({ id: "prop-1" });
    prismaMock.client.findUnique.mockResolvedValue({ id: "client-1", representative: null });

    await applyExtractedProperty(expediente, {
      name: "Hacienda La Esperanza",
      owner: "Otro Propietario Extraído Por IA",
      address: "Calle 10 # 5-20"
    });

    expect(prismaMock.property.update).toHaveBeenCalledWith({
      where: { id: "prop-1" },
      data: { address: "Calle 10 # 5-20" }
    });
  });

  it("llena Client.representative solo si estaba vacío", async () => {
    prismaMock.property.findFirst.mockResolvedValue({ id: "prop-1", owner: null, address: null, cadastralCode: null, realEstateRegistration: null, city: null, village: null });
    prismaMock.client.findUnique.mockResolvedValue({ id: "client-1", representative: "Ya tiene representante" });

    await applyExtractedProperty(expediente, {
      name: "Hacienda La Esperanza",
      representative: "Nuevo Representante Extraído"
    });

    expect(prismaMock.client.update).not.toHaveBeenCalled();
  });
});

describe("parseClientDataCsv", () => {
  it("devuelve un mapa vacío si no hay CSV", () => {
    expect(parseClientDataCsv(undefined).size).toBe(0);
    expect(parseClientDataCsv("").size).toBe(0);
  });

  it("parsea filas por expedienteCode con todas las columnas esperadas", () => {
    const csv = [
      "expedienteCode,representative,propertyName,propertyAddress,propertyOwner,cadastralCode,realEstateRegistration,city,village",
      "OCR-0001,Carlos Ramirez,Hacienda La Esperanza,Calle 10 # 5-20,Juan Perez,000-111,50N-123,Chia,El Rosal"
    ].join("\n");

    const rows = parseClientDataCsv(csv);

    expect(rows.size).toBe(1);
    expect(rows.get("OCR-0001")).toEqual({
      name: "Hacienda La Esperanza",
      address: "Calle 10 # 5-20",
      owner: "Juan Perez",
      representative: "Carlos Ramirez",
      cadastralCode: "000-111",
      realEstateRegistration: "50N-123",
      city: "Chia",
      village: "El Rosal"
    });
  });

  it("ignora filas sin expedienteCode", () => {
    const csv = ["expedienteCode,propertyName", ",Predio sin codigo"].join("\n");
    expect(parseClientDataCsv(csv).size).toBe(0);
  });

  it("deja en null las columnas vacías o ausentes", () => {
    const csv = ["expedienteCode,propertyName", "OCR-0002,Finca Sin Datos"].join("\n");
    const rows = parseClientDataCsv(csv);
    expect(rows.get("OCR-0002")?.representative).toBeNull();
    expect(rows.get("OCR-0002")?.address).toBeNull();
  });
});

describe("extractPropertyFromText - fallback Gemini -> OpenAI", () => {
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  const originalOpenAiKey = process.env.OPENAI_API_KEY;
  const originalFetch = global.fetch;

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalGeminiKey;
    process.env.OPENAI_API_KEY = originalOpenAiKey;
    global.fetch = originalFetch;
  });

  it("usa Gemini cuando GEMINI_API_KEY está configurada, y no llama a OpenAI", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    delete process.env.OPENAI_API_KEY;

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ name: "Predio Gemini" }) }] } }]
      })
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await extractPropertyFromText("texto de prueba");

    expect(result).toEqual({ name: "Predio Gemini" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("generativelanguage.googleapis.com");
  });

  it("cae a OpenAI si Gemini falla (respuesta no-ok)", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.OPENAI_API_KEY = "test-openai-key";

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, text: async () => "Gemini caído" })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ name: "Predio OpenAI" }) } }]
        })
      });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await extractPropertyFromText("texto de prueba");

    expect(result).toEqual({ name: "Predio OpenAI" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("generativelanguage.googleapis.com");
    expect(fetchMock.mock.calls[1][0]).toContain("api.openai.com");
  });

  it("usa OpenAI directamente si no hay GEMINI_API_KEY configurada", async () => {
    delete process.env.GEMINI_API_KEY;
    process.env.OPENAI_API_KEY = "test-openai-key";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({ name: "Predio OpenAI" }) } }]
      })
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await extractPropertyFromText("texto de prueba");

    expect(result).toEqual({ name: "Predio OpenAI" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("api.openai.com");
  });

  it("no llama a ningún proveedor si no hay ninguna key configurada", async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await extractPropertyFromText("texto de prueba");

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
