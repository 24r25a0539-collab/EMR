import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-emr-platform-jwt-secret-key-change-in-production-2026';

async function main() {
  const patientUsers = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    include: { patient: true },
  });

  console.log(`Found ${patientUsers.length} patient users.`);

  for (const u of patientUsers) {
    console.log(`\nTesting user: ${u.email || u.mobile} (User ID: ${u.id}, Patient ID: ${u.patient?.id}, Role: ${u.role})`);
    const token = jwt.sign({ id: u.id, role: u.role }, JWT_SECRET, { expiresIn: '1d' });

    // 1. Access Permissions
    const permRes = await fetch(`${BASE_URL}/patients/me/access-permissions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`  GET /patients/me/access-permissions status: ${permRes.status}`);
    const permData = await permRes.json().catch(() => ({}));
    console.log(`  GET /patients/me/access-permissions body:`, permData);

    // 2. Documents
    const docRes = await fetch(`${BASE_URL}/patients/me/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`  GET /patients/me/documents status: ${docRes.status}`);
    const docData = await docRes.json().catch(() => ({}));
    console.log(`  GET /patients/me/documents body success:`, docData.success, `count:`, docData.documents?.length);

    // 3. Lab Reports
    const labRes = await fetch(`${BASE_URL}/patients/me/lab-reports`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`  GET /patients/me/lab-reports status: ${labRes.status}`);
    const labData = await labRes.json().catch(() => ({}));
    console.log(`  GET /patients/me/lab-reports body success:`, labData.success, `count:`, labData.reports?.length);
  }
}

main().finally(() => prisma.$disconnect());
