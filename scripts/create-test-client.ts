import { PrismaClient, Role, Status, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Erfor2026!", 12);

  // Crear usuario con rol CLIENTE_EXTERNO
  const user = await prisma.user.upsert({
    where: { email: "cliente@erfor.co" },
    update: {},
    create: {
      name: "Cliente Prueba",
      email: "cliente@erfor.co",
      passwordHash,
      role: Role.CLIENTE_EXTERNO,
      status: Status.ACTIVE,
      avatar: "/avatar-erwin.svg"
    }
  });

  // Crear registro de cliente asociado a ese email
  const client = await prisma.client.upsert({
    where: { id: "test-client-id" },
    update: {},
    create: {
      id: "test-client-id",
      name: "Empresa de Prueba SAS",
      type: "Cliente",
      documentType: "NIT",
      documentNumber: "900123456",
      representative: "Cliente Prueba",
      email: "cliente@erfor.co",
      phone: "+57 300 123 4567",
      status: Status.ACTIVE,
      priority: Priority.MEDIUM
    }
  });

  // Crear un proyecto para este cliente para que el portal no esté vacío
  await prisma.project.upsert({
    where: { id: "test-client-project" },
    update: {},
    create: {
      id: "test-client-project",
      clientId: client.id,
      name: "Trámite Ambiental de Prueba",
      type: "Proyecto de Licenciamiento",
      status: "EVALUATION",
      description: "Este es un proyecto de prueba creado automáticamente.",
      responsibleUserId: user.id
    }
  });

  console.log("✅ Usuario cliente creado exitosamente");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
