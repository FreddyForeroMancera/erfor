const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const c = await prisma.client.count();
  console.log('Clients:', c);
}

main().catch(console.error).finally(() => prisma.$disconnect());
