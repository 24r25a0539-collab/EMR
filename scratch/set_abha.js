const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const patient = await prisma.patient.findFirst({
    where: { healthId: 'HP-100250' },
  });
  if (patient) {
    await prisma.patient.update({
      where: { id: patient.id },
      data: { abhaId: '12345678901234' },
    });
    console.log(`Updated patient ${patient.fullName} (HP-100250) with ABHA ID 12345678901234`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
