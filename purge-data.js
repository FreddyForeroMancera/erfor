const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando purga de la base de datos (Conservando usuarios)...");
  
  const models = [
    'activityLog', 'comment', 'document', 'environmentalObligation', 
    'requirement', 'task', 'report', 'procedure', 'environmentalFile', 
    'project', 'client', 'aIConversation', 'aIMessage', 'aiMessage', 'aiConversation'
  ];
  
  for (const model of models) {
    try {
      if (prisma[model]) {
        await prisma[model].deleteMany({});
        console.log(`Tabla purgada: ${model}`);
      }
    } catch (e) {
      console.log(`Error ignorado en ${model}: ${e.message}`);
    }
  }
  
  console.log("¡Base de datos limpiada con éxito! Lista para la carga real.");
}

main()
  .catch((e) => {
    console.error("Error durante la purga:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
