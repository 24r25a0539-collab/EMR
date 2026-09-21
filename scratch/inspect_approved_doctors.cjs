const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const docs = await prisma.doctor.findMany({
    where: { regStatus: 'APPROVED' },
    include: { affiliations: { include: { hospital: true } } },
  });
  console.log(`Found ${docs.length} approved doctors in DB:`);
  for (const d of docs) {
    console.log(`- ID: ${d.id} | Name: ${d.fullName} | Specialization: ${d.specialization} | Reg: ${d.registrationNumber} | Hospital: ${d.hospitalAffiliation || d.affiliations?.[0]?.hospital?.name} | Status: ${d.regStatus}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
