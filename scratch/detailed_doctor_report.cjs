const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: true,
      appointments: true,
      consultations: true,
      prescriptions: true,
      accessRequests: true,
      permissions: true,
      affiliations: { include: { hospital: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Total Doctors: ${doctors.length}`);
  for (const d of doctors) {
    console.log(JSON.stringify({
      id: d.id,
      userId: d.userId,
      email: d.user?.email,
      name: d.fullName,
      regNumber: d.registrationNumber,
      regStatus: d.regStatus,
      createdAt: d.createdAt,
      appointmentsCount: d.appointments.length,
      appointmentIds: d.appointments.map(a => a.id),
      consultationsCount: d.consultations.length,
      consultationIds: d.consultations.map(c => c.id),
      prescriptionsCount: d.prescriptions.length,
      prescriptionIds: d.prescriptions.map(p => p.id),
      accessRequestsCount: d.accessRequests.length,
      permissionsCount: d.permissions.length,
      affiliations: d.affiliations.map(a => ({ hospital: a.hospital?.name, role: a.role, status: a.status }))
    }, null, 2));
  }
}

main().finally(() => prisma.$disconnect());
