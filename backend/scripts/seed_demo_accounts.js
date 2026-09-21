import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function sha256(val) {
  return crypto.createHash('sha256').update(val).digest('hex');
}

async function main() {
  console.log('Seeding Demo Accounts (Doctor, Hospital, Admin)...');

  // 1. Hospital
  let hospital = await prisma.hospital.findFirst({
    where: { name: 'Apex Health City' },
  });

  if (!hospital) {
    hospital = await prisma.hospital.create({
      data: {
        name: 'Apex Health City',
        address: 'Road No. 36, Jubilee Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500033',
        phone: '+91 40 2360 7777',
        email: 'info@apexhealthcity.in',
        emergencyAvailable: true,
        emergencyPhone: '+91 40 2360 9999',
        hours: '24/7',
        status: 'ACTIVE',
        verified: true,
        type: 'Multi-Specialty',
      },
    });
    console.log('Created Hospital:', hospital.name, hospital.id);
  } else {
    console.log('Hospital already exists:', hospital.name, hospital.id);
  }

  // 2. Demo Doctor
  let doctorUser = await prisma.user.findFirst({
    where: { email: 'dr.ananya@apollohyderabad.internal' },
    include: { doctor: true },
  });

  if (!doctorUser) {
    const passwordHash = sha256('Doctor@123');
    doctorUser = await prisma.user.create({
      data: {
        email: 'dr.ananya@apollohyderabad.internal',
        mobile: '9876543211',
        passwordHash,
        role: 'DOCTOR',
        status: 'ACTIVE',
        doctor: {
          create: {
            fullName: 'Dr. Ananya Sharma',
            registrationNumber: 'TS-MCI-2024-8921',
            specialization: 'Cardiology',
            qualifications: 'MBBS, MD (General Medicine), DM (Cardiology)',
            experienceYears: 14,
            hospitalAffiliation: hospital.name,
            department: 'Interventional Cardiology',
            languages: 'English, Hindi, Telugu',
            regStatus: 'APPROVED',
            govtIdStatus: 'VERIFIED',
            degreeStatus: 'VERIFIED',
            experienceDocStatus: 'VERIFIED',
          },
        },
      },
      include: { doctor: true },
    });
    console.log('Created Demo Doctor:', doctorUser.doctor?.fullName, doctorUser.doctor?.id);
  } else {
    console.log('Demo Doctor already exists:', doctorUser.doctor?.fullName, doctorUser.doctor?.id);
  }

  // Ensure Doctor-Hospital affiliation
  if (doctorUser?.doctor) {
    const existingAffil = await prisma.doctorHospitalAffiliation.findFirst({
      where: { doctorId: doctorUser.doctor.id, hospitalId: hospital.id },
    });
    if (!existingAffil) {
      await prisma.doctorHospitalAffiliation.create({
        data: {
          doctorId: doctorUser.doctor.id,
          hospitalId: hospital.id,
          department: 'Cardiology',
          role: 'Head of Interventional Cardiology',
          startDate: '2020-01-01',
          status: 'ACTIVE',
        },
      });
      console.log('Affiliated doctor with hospital.');
    }
  }

  // 3. Demo Admin
  let adminUser = await prisma.user.findFirst({
    where: { email: 'admin@emr-platform.internal' },
    include: { admin: true },
  });

  if (!adminUser) {
    const passwordHash = sha256('Admin@123456');
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@emr-platform.internal',
        mobile: '9876543212',
        passwordHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        admin: {
          create: {
            fullName: 'System Administrator',
            department: 'Security & Clinical Governance',
            roleTitle: 'Chief Security Officer',
          },
        },
      },
      include: { admin: true },
    });
    console.log('Created Demo Admin:', adminUser.admin?.fullName, adminUser.admin?.id);
  } else {
    console.log('Demo Admin already exists:', adminUser.admin?.fullName, adminUser.admin?.id);
  }

  console.log('Demo accounts seeded successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
