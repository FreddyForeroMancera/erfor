import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(error: unknown, fallback = "Error interno") {
  if (error instanceof Response) return error;
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Datos inválidos", issues: error.flatten() }, { status: 422 });
  }
  const message = error instanceof Error ? error.message : fallback;
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function readJson(request: Request) {
  const text = await request.text();
  return text ? JSON.parse(text) : {};
}
