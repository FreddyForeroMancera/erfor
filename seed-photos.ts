import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPhotos() {
  const files = await prisma.environmentalFile.findMany();
  const photos = [
    'https://upload.wikimedia.org/wikipedia/commons/e/e0/Cocora_valley_Colombia.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/8/87/Coffee_plantation_in_Colombia.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/d/da/Paisaje_Cultural_Cafetero.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/1/15/Piedra_del_Pe%C3%B1ol_en_Guatap%C3%A9%2C_Antioquia.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/6/67/Desierto_de_la_Tatacoa_en_Colombia.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/b/b8/Nevado_del_Tolima%2C_Colombia.jpg'
  ];
  
  let count = 0;
  for (const file of files) {
    // Delete old seed photos to avoid duplicates if run multiple times
    await prisma.document.deleteMany({
      where: { environmentalFileId: file.id, source: 'SEED_PHOTO' }
    });

    await prisma.document.createMany({
      data: [
        {
          environmentalFileId: file.id,
          name: 'Panorámica Terreno.jpg',
          fileUrl: photos[Math.floor(Math.random() * photos.length)],
          fileType: 'image/jpeg',
          category: 'FOTOGRAFIA',
          uploadedBy: file.responsibleUserId || undefined,
          source: 'SEED_PHOTO'
        },
        {
          environmentalFileId: file.id,
          name: 'Detalle Inspección.jpg',
          fileUrl: photos[Math.floor(Math.random() * photos.length)],
          fileType: 'image/jpeg',
          category: 'FOTOGRAFIA',
          uploadedBy: file.responsibleUserId || undefined,
          source: 'SEED_PHOTO'
        }
      ]
    });
    count += 2;
  }
  
  console.log(`Seeded ${count} photos.`);
}

seedPhotos()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
