import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, readJson } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_jwt_secret_for_development_only_12345";

const createClientSchema = z.object({
  name: z.string().min(2),
  documentType: z.string().optional(),
  documentNumber: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  contactPerson: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role === "CLIENTE_EXTERNO") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ items: clients });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || sessionUser.role === "CLIENTE_EXTERNO") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await readJson(request);
    const data = createClientSchema.parse(body);

    // Verify if user email already exists
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return NextResponse.json({ error: "Ya existe un usuario con este correo electrónico." }, { status: 400 });
    }

    // Generate random temp password
    const tempPassword = Math.random().toString(36).slice(-8) + "X!";
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Run in transaction to ensure both User and Client are created
    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.contactPerson || data.name,
          email: data.email,
          passwordHash,
          role: "CLIENTE_EXTERNO",
          status: "ACTIVE"
        }
      });

      const newClient = await tx.client.create({
        data: {
          name: data.name,
          type: "Empresa",
          documentType: data.documentType,
          documentNumber: data.documentNumber,
          email: data.email,
          phone: data.phone,
          contactPerson: data.contactPerson,
          status: "ACTIVE",
          priority: "MEDIUM"
        }
      });

      return { user: newUser, client: newClient };
    });

    // Create magic activation link
    const token = jwt.sign(
      { userId: result.user.id, email: result.user.email, type: "activation" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    
    // Determine base URL dynamically or from env
    const origin = request.headers.get("origin") || "http://localhost:5173";
    const activationLink = `${origin}/portal/activar?token=${token}`;

    console.log("=========================================");
    console.log(`[SIMULACIÓN CORREO] NUEVO CLIENTE CREADO`);
    console.log(`Cliente: ${data.name}`);
    console.log(`Enlace Mágico: ${activationLink}`);
    console.log("=========================================");

    return NextResponse.json({ 
      success: true, 
      client: result.client, 
      activationLink // Returning it so frontend can display it temporarily for development
    });
  } catch (error) {
    return fail(error);
  }
}
