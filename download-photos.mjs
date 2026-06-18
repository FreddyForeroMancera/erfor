import fs from 'fs';
import path from 'path';
import https from 'https';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'ERFOR/1.0' } }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

async function run() {
  const seedDir = path.join(process.cwd(), 'public', 'seed-images');
  if (!fs.existsSync(seedDir)) {
    fs.mkdirSync(seedDir, { recursive: true });
  }

  const images = [
    { name: 'cocora.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Cocora_valley_Colombia.jpg' },
    { name: 'coffee.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Coffee_plantation_in_Colombia.jpg' },
    { name: 'guatape.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Piedra_del_Pe%C3%B1ol_en_Guatap%C3%A9%2C_Antioquia.jpg' },
    { name: 'tatacoa.jpg', url: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Desierto_de_la_Tatacoa_en_Colombia.jpg' }
  ];

  for (const img of images) {
    const dest = path.join(seedDir, img.name);
    if (!fs.existsSync(dest)) {
      console.log(`Downloading ${img.name}...`);
      await downloadFile(img.url, dest);
    }
  }

  const files = await prisma.environmentalFile.findMany();
  let count = 0;
  for (const file of files) {
    await prisma.document.deleteMany({
      where: { environmentalFileId: file.id, source: 'SEED_PHOTO' }
    });

    const randomImg1 = images[Math.floor(Math.random() * images.length)].name;
    const randomImg2 = images[Math.floor(Math.random() * images.length)].name;

    await prisma.document.createMany({
      data: [
        {
          environmentalFileId: file.id,
          name: 'Panorámica Terreno.jpg',
          fileUrl: `/seed-images/${randomImg1}`,
          fileType: 'image/jpeg',
          category: 'FOTOGRAFIA',
          uploadedBy: file.responsibleUserId || undefined,
          source: 'SEED_PHOTO'
        },
        {
          environmentalFileId: file.id,
          name: 'Detalle Inspección.jpg',
          fileUrl: `/seed-images/${randomImg2}`,
          fileType: 'image/jpeg',
          category: 'FOTOGRAFIA',
          uploadedBy: file.responsibleUserId || undefined,
          source: 'SEED_PHOTO'
        }
      ]
    });
    count += 2;
  }
  
  console.log(`Successfully downloaded and seeded ${count} local photos.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
