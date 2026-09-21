const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { patient: true, doctor: true },
  });
  console.log('Registered Users in DB:');
  for (const u of users) {
    console.log(`- ID: ${u.id} | Email: ${u.email} | Mobile: ${u.mobile} | Role: ${u.role}`);
    if (u.patient) {
      console.log(`  Patient: ${u.patient.fullName} | HealthID: ${u.patient.healthId} | ABHA: ${u.patient.abhaId} | ID: ${u.patient.id}`);
    }
    if (u.doctor) {
      console.log(`  Doctor: ${u.doctor.fullName} | Reg: ${u.doctor.registrationNumber} | ID: ${u.doctor.id}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
