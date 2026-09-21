const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const apts = await prisma.appointment.findMany({
    include: { doctor: true, patient: true, hospital: true },
  });
  console.log(`Found ${apts.length} appointments:`);
  for (const a of apts) {
    console.log(`- ID: ${a.id} | Num: ${a.appointmentNumber} | Patient: ${a.patient?.fullName} | Doctor: ${a.doctor?.fullName} | Date: ${a.date} | Slot: ${a.timeSlot} | Status: ${a.status}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
