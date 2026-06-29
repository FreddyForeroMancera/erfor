import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fail, readJson } from "@/lib/http";
import { getSessionUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Resend } from "resend";

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

    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: 'ERFOR <onboarding@resend.dev>', // Usar dominio verificado en prod
          to: data.email,
          subject: 'Bienvenido a ERFOR - Activa tu cuenta',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #0f172a;">Bienvenido a ERFOR</h2>
              <p style="color: #475569; font-size: 16px;">Hola ${data.contactPerson || data.name},</p>
              <p style="color: #475569; font-size: 16px;">Se ha creado una cuenta para tu empresa en la plataforma ambiental de ERFOR.</p>
              <p style="color: #475569; font-size: 16px;">Para establecer tu contraseña y acceder al portal, haz clic en el siguiente enlace (válido por 7 días):</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${activationLink}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Activar mi cuenta</a>
              </div>
              <p style="color: #94a3b8; font-size: 14px;">Si no solicitaste esta cuenta, puedes ignorar este correo.</p>
            </div>
          `
        });
        console.log(`[RESEND] Correo enviado exitosamente a ${data.email}`);
      } catch (err) {
        console.error(`[RESEND] Error enviando correo:`, err);
      }
    } else {
      console.log("=========================================");
      console.log(`[AVISO] RESEND_API_KEY no configurada en .env`);
      console.log(`[SIMULACIÓN CORREO] NUEVO CLIENTE CREADO`);
      console.log(`Cliente: ${data.name}`);
      console.log(`Enlace Mágico: ${activationLink}`);
      console.log("=========================================");
    }

    return NextResponse.json({ 
      success: true, 
      client: result.client, 
      activationLink // Returning it so frontend can display it temporarily for development
    });
  } catch (error) {
    return fail(error);
  }
}
