import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, mobile: true, role: true, email: true },
  });
  const patients = await prisma.patient.findMany({
    select: { id: true, healthId: true, fullName: true, userId: true },
  });
  const doctors = await prisma.doctor.findMany();
  const admins = await prisma.admin.findMany();
  console.log('USERS:', users);
  console.log('PATIENTS:', patients);
  console.log('DOCTORS:', doctors);
  console.log('ADMINS:', admins);
}

main().catch(console.error).finally(() => prisma.$disconnect());
