import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPhotos() {
  const files = await prisma.environmentalFile.findMany();
  const photos = [
    '/seed-images/cocora.png',
    '/seed-images/coffee.png',
    '/seed-images/paisaje.png',
    '/seed-images/cultivo.png'
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
