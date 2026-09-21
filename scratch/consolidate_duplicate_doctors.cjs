const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function consolidateDuplicates() {
  console.log('--- Starting Safe Doctor Consolidation in PostgreSQL ---');

  // Find all doctors
  const allDoctors = await prisma.doctor.findMany({
    include: {
      user: true,
      appointments: true,
      consultations: true,
      prescriptions: true,
      labReports: true,
      accessRequests: true,
      permissions: true,
      emergencySessions: true,
      correctionRequests: true,
      affiliations: true
    },
    orderBy: { createdAt: 'asc' }
  });

  // Group by normalized name
  const nameMap = new Map();
  for (const doc of allDoctors) {
    const key = doc.fullName.trim().toLowerCase();
    if (!nameMap.has(key)) {
      nameMap.set(key, []);
    }
    nameMap.get(key).push(doc);
  }

  for (const [name, docs] of nameMap.entries()) {
    if (docs.length <= 1) {
      console.log(`Unique doctor (no duplicates): "${docs[0].fullName}" [${docs[0].id}]`);
      continue;
    }

    console.log(`\nFound ${docs.length} records for "${docs[0].fullName}":`);
    
    // Choose the canonical doctor (prefer the one with the most relations or earliest created)
    let canonical = docs[0];
    let maxRelations = -1;
    for (const d of docs) {
      const relationCount = d.appointments.length + d.consultations.length + d.prescriptions.length + d.accessRequests.length + d.permissions.length + d.affiliations.length;
      if (relationCount > maxRelations) {
        maxRelations = relationCount;
        canonical = d;
      }
    }

    console.log(`  Selected Canonical Doctor ID: ${canonical.id} (Email: ${canonical.user?.email}, Reg: ${canonical.registrationNumber})`);

    const duplicates = docs.filter(d => d.id !== canonical.id);

    for (const dup of duplicates) {
      console.log(`  Migrating relations from Duplicate ID: ${dup.id} (Email: ${dup.user?.email})...`);

      // 1. Appointments
      if (dup.appointments.length > 0) {
        await prisma.appointment.updateMany({
          where: { doctorId: dup.id },
          data: { doctorId: canonical.id }
        });
        console.log(`    Migrated ${dup.appointments.length} appointments`);
      }

      // 2. Consultations
      if (dup.consultations.length > 0) {
        await prisma.consultation.updateMany({
          where: { doctorId: dup.id },
          data: { doctorId: canonical.id }
        });
        console.log(`    Migrated ${dup.consultations.length} consultations`);
      }

      // 3. Prescriptions
      if (dup.prescriptions.length > 0) {
        await prisma.prescription.updateMany({
          where: { doctorId: dup.id },
          data: { doctorId: canonical.id }
        });
        console.log(`    Migrated ${dup.prescriptions.length} prescriptions`);
      }

      // 4. Lab Reports
      if (dup.labReports.length > 0) {
        await prisma.labReport.updateMany({
          where: { doctorId: dup.id },
          data: { doctorId: canonical.id }
        });
        console.log(`    Migrated ${dup.labReports.length} lab reports`);
      }

      // 5. Access Requests
      if (dup.accessRequests.length > 0) {
        await prisma.accessRequest.updateMany({
          where: { doctorId: dup.id },
          data: { doctorId: canonical.id }
        });
        console.log(`    Migrated ${dup.accessRequests.length} access requests`);
      }

      // 6. Permissions
      if (dup.permissions.length > 0) {
        await prisma.permission.updateMany({
          where: { doctorId: dup.id },
          data: { doctorId: canonical.id }
        });
        console.log(`    Migrated ${dup.permissions.length} permissions`);
      }

      // 7. Emergency Sessions
      if (dup.emergencySessions.length > 0) {
        await prisma.emergencySession.updateMany({
          where: { doctorId: dup.id },
          data: { doctorId: canonical.id }
        });
        console.log(`    Migrated ${dup.emergencySessions.length} emergency sessions`);
      }

      // 8. Correction Requests
      if (dup.correctionRequests.length > 0) {
        await prisma.correctionRequest.updateMany({
          where: { doctorId: dup.id },
          data: { doctorId: canonical.id }
        });
        console.log(`    Migrated ${dup.correctionRequests.length} correction requests`);
      }

      // 9. Affiliations
      if (dup.affiliations.length > 0) {
        for (const aff of dup.affiliations) {
          // Check if canonical already has this hospital affiliation
          const existingAff = await prisma.doctorHospitalAffiliation.findFirst({
            where: { doctorId: canonical.id, hospitalId: aff.hospitalId }
          });
          if (!existingAff) {
            await prisma.doctorHospitalAffiliation.update({
              where: { id: aff.id },
              data: { doctorId: canonical.id }
            });
            console.log(`    Migrated affiliation to hospital ${aff.hospitalId}`);
          } else {
            await prisma.doctorHospitalAffiliation.delete({
              where: { id: aff.id }
            });
          }
        }
      }

      // 10. Delete the duplicate doctor and user
      await prisma.doctor.delete({
        where: { id: dup.id }
      });
      if (dup.userId) {
        await prisma.user.delete({
          where: { id: dup.userId }
        });
      }
      console.log(`    Deleted redundant doctor & user row for [${dup.id}]`);
    }
  }

  console.log('\n--- Consolidation Completed ---');
}

consolidateDuplicates()
  .catch(err => {
    console.error('Error during consolidation:', err);
  })
  .finally(() => prisma.$disconnect());
