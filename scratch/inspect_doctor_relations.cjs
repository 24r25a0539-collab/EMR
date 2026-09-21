const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: true,
      appointments: true,
      consultations: true,
      prescriptions: true,
      labReports: true,
      accessRequests: true,
      permissions: true,
      affiliations: { include: { hospital: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Total Doctors in DB: ${doctors.length}`);
  for (const d of doctors) {
    console.log(`\nDoctor ID: ${d.id}`);
    console.log(`  Name: ${d.fullName} | Reg: ${d.registrationNumber} | Status: ${d.regStatus}`);
    console.log(`  Email: ${d.user?.email} | Mobile: ${d.user?.mobile}`);
    console.log(`  Created: ${d.createdAt.toISOString()}`);
    console.log(`  Appointments: ${d.appointments.length} | Consultations: ${d.consultations.length} | Prescriptions: ${d.prescriptions.length} | AccessRequests: ${d.accessRequests.length} | Permissions: ${d.permissions.length}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
