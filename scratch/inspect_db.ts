import { prisma } from '../backend/src/models/prisma.js';

async function main() {
  const users = await prisma.user.findMany();
  console.log(`Total users in DB: ${users.length}`);
  const patients = await prisma.patient.findMany({ include: { user: true } });
  console.log('Patients in DB:', patients.map(p => ({
    id: p.id,
    healthId: p.healthId,
    name: p.fullName,
    mobile: p.user?.mobile,
  })));
  const doctors = await prisma.doctor.findMany({ include: { user: true } });
  console.log('Doctors in DB:', doctors.map(d => ({
    id: d.id,
    name: d.fullName,
    reg: d.registrationNumber,
    status: d.regStatus,
    userStatus: d.user?.status,
    email: d.user?.email,
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
