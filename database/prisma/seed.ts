import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// Utility function to compute SHA-256 hash
function calculateSha256(data: any): string {
  const canonicalString = typeof data === 'string' ? data : JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}

async function main() {
  console.log('🌱 Starting EMR Database Seeding with realistic fictional data...');

  // 1. Clean existing records (in proper reverse dependency order)
  await prisma.notification.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.securityAlert.deleteMany();
  await prisma.blockchainProof.deleteMany();
  await prisma.correctionRequest.deleteMany();
  await prisma.emergencySession.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.accessRequest.deleteMany();
  await prisma.prescriptionMedicine.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.labReport.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.medicalRecordVersion.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.allergy.deleteMany();
  await prisma.medicalCondition.deleteMany();
  await prisma.healthProfile.deleteMany();
  await prisma.doctorHospitalAffiliation.deleteMany();
  await prisma.hospitalDepartment.deleteMany();
  await prisma.hospital.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.session.deleteMany();
  await prisma.loginActivity.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing records.');

  // 2. Create Hospitals
  const hospitalApollo = await prisma.hospital.create({
    data: {
      name: 'Apollo Health City',
      address: 'Road No. 72, Jubilee Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500033',
      phone: '+91 40 2360 7777',
      email: 'emergency@apollohyderabad.internal',
      emergencyAvailable: true,
      emergencyPhone: '+91 40 1066',
      hours: '24 Hours / 7 Days',
      status: 'ACTIVE',
      verified: true,
      latitude: 17.4325,
      longitude: 78.4071,
      type: 'Super-Specialty Tertiary Care',
      departments: {
        create: [
          { name: 'Cardiology', description: 'Advanced cardiac care, interventional cardiology & electrophysiology' },
          { name: 'Neurology', description: 'Comprehensive neurological diagnostic & surgical care' },
          { name: 'Orthopedics', description: 'Joint replacement, spine surgery & sports medicine' },
          { name: 'Emergency Medicine', description: 'Level 1 trauma and 24/7 cardiac emergency care' },
        ],
      },
    },
  });

  const hospitalCare = await prisma.hospital.create({
    data: {
      name: 'Care Multispecialty Hospital',
      address: 'Road No. 1, Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
      phone: '+91 40 3041 8888',
      email: 'care@carehospitals.internal',
      emergencyAvailable: true,
      emergencyPhone: '+91 40 1056',
      hours: '24 Hours / 7 Days',
      status: 'ACTIVE',
      verified: true,
      latitude: 17.4156,
      longitude: 78.4482,
      type: 'Multispecialty Hospital',
      departments: {
        create: [
          { name: 'General Medicine', description: 'Internal medicine and chronic disease management' },
          { name: 'Dermatology', description: 'Clinical & cosmetic dermatology' },
          { name: 'Pediatrics', description: 'Neonatal & pediatric specialty care' },
        ],
      },
    },
  });

  const hospitalMax = await prisma.hospital.create({
    data: {
      name: 'Max Healthcare Hospital',
      address: 'Plot 12, Financial District, Gachibowli',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500032',
      phone: '+91 40 4455 6677',
      email: 'contact@maxhealthcare.internal',
      emergencyAvailable: true,
      emergencyPhone: '+91 40 1022',
      hours: '24 Hours / 7 Days',
      status: 'ACTIVE',
      verified: true,
      latitude: 17.4219,
      longitude: 78.3489,
      type: 'Super-Specialty Hospital',
      departments: {
        create: [
          { name: 'Pulmonology', description: 'Respiratory medicine and sleep disorders' },
          { name: 'Gastroenterology', description: 'Digestive disease and hepatology' },
        ],
      },
    },
  });

  console.log('🏥 Created Hospitals and Departments.');

  // 3. Create Admin User (Secured, never exposed on public login)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@emr-platform.internal',
      mobile: '9900000001',
      // In production hashed with bcrypt; here using SHA-256 for mock seed setup
      passwordHash: calculateSha256('Admin@Secure2026!'),
      role: 'ADMIN',
      status: 'ACTIVE',
      preferredLanguage: 'en',
      admin: {
        create: {
          fullName: 'Vikram Malhotra',
          department: 'Security & Compliance Administration',
          roleTitle: 'Chief Security Administrator',
        },
      },
    },
  });

  console.log('🛡️ Created Admin User.');

  // 4. Create Doctor Users & Profiles
  // Dr. Ananya Sharma (Cardiologist - Approved)
  const doctorUser1 = await prisma.user.create({
    data: {
      email: 'dr.ananya@apollohyderabad.internal',
      mobile: '9848011223',
      passwordHash: calculateSha256('Doctor@123'),
      role: 'DOCTOR',
      status: 'ACTIVE',
      preferredLanguage: 'en',
      doctor: {
        create: {
          fullName: 'Dr. Ananya Sharma',
          registrationNumber: 'MCI-CARD-2018-8472',
          specialization: 'Cardiology',
          qualifications: 'MBBS, MD (General Medicine), DM (Cardiology)',
          experienceYears: 12,
          hospitalAffiliation: hospitalApollo.name,
          department: 'Cardiology',
          languages: 'English, Telugu, Hindi',
          govtIdStatus: 'VERIFIED',
          degreeStatus: 'VERIFIED',
          experienceDocStatus: 'VERIFIED',
          regStatus: 'APPROVED',
          workingDays: 'Mon,Tue,Wed,Thu,Fri,Sat',
          workingHours: '09:00 AM - 04:30 PM',
          appointmentDuration: 30,
          consultationTypes: 'IN_PERSON,ONLINE',
          affiliations: {
            create: {
              hospitalId: hospitalApollo.id,
              department: 'Cardiology',
              role: 'Senior Consultant Cardiologist',
              startDate: '2019-04-01',
              status: 'ACTIVE',
            },
          },
        },
      },
    },
    include: { doctor: true },
  });

  // Dr. Rajesh Verma (Neurologist - Approved)
  const doctorUser2 = await prisma.user.create({
    data: {
      email: 'dr.rajesh@carehospitals.internal',
      mobile: '9848022334',
      passwordHash: calculateSha256('Doctor@123'),
      role: 'DOCTOR',
      status: 'ACTIVE',
      preferredLanguage: 'en',
      doctor: {
        create: {
          fullName: 'Dr. Rajesh Verma',
          registrationNumber: 'MCI-NEUR-2015-1029',
          specialization: 'Neurology',
          qualifications: 'MBBS, MD (Medicine), MCh (Neuro Surgery)',
          experienceYears: 16,
          hospitalAffiliation: hospitalCare.name,
          department: 'Neurology',
          languages: 'English, Hindi, Marathi',
          govtIdStatus: 'VERIFIED',
          degreeStatus: 'VERIFIED',
          experienceDocStatus: 'VERIFIED',
          regStatus: 'APPROVED',
          workingDays: 'Mon,Wed,Fri',
          workingHours: '10:00 AM - 02:00 PM',
          appointmentDuration: 45,
          consultationTypes: 'IN_PERSON',
          affiliations: {
            create: {
              hospitalId: hospitalCare.id,
              department: 'Neurology',
              role: 'Chief Neurosurgeon',
              startDate: '2016-08-15',
              status: 'ACTIVE',
            },
          },
        },
      },
    },
    include: { doctor: true },
  });

  // Dr. Priya Nair (Dermatologist - Pending Verification)
  const doctorUser3 = await prisma.user.create({
    data: {
      email: 'dr.priya@maxhealthcare.internal',
      mobile: '9848033445',
      passwordHash: calculateSha256('Doctor@123'),
      role: 'DOCTOR',
      status: 'ACTIVE',
      preferredLanguage: 'en',
      doctor: {
        create: {
          fullName: 'Dr. Priya Nair',
          registrationNumber: 'MCI-DERM-2021-3918',
          specialization: 'Dermatology',
          qualifications: 'MBBS, MD (DVL)',
          experienceYears: 4,
          hospitalAffiliation: hospitalMax.name,
          department: 'Dermatology',
          languages: 'English, Tamil, Hindi',
          govtIdStatus: 'PENDING',
          degreeStatus: 'PENDING',
          experienceDocStatus: 'PENDING',
          regStatus: 'PENDING',
          verificationNotes: 'Certificates awaiting medical board verification review by administrator.',
          workingDays: 'Tue,Thu,Sat',
          workingHours: '11:00 AM - 05:00 PM',
          appointmentDuration: 20,
          consultationTypes: 'IN_PERSON,ONLINE',
        },
      },
    },
    include: { doctor: true },
  });

  console.log('🩺 Created Doctors (Approved & Pending verification).');

  // 5. Create Patient Rahul (Primary demo persona with Health ID HP-100245)
  const patientUserRahul = await prisma.user.create({
    data: {
      email: 'rahul.sharma@example.com',
      mobile: '9876543210',
      role: 'PATIENT',
      status: 'ACTIVE',
      preferredLanguage: 'en',
      patient: {
        create: {
          healthId: 'HP-100245',
          fullName: 'Rahul Sharma',
          dob: '1992-06-15',
          gender: 'Male',
          bloodGroup: 'O+',
          address: 'Flat 402, Green Meadows, Madhapur',
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          pincode: '500081',
          govtIdType: 'Aadhaar',
          govtIdNumberMasked: 'XXXX-XXXX-8921',
          identityStatus: 'VERIFIED',
          identityVerifiedAt: new Date('2024-01-10T10:00:00Z'),
          height: 175.5,
          weight: 72.0,
          emergencyNotes: 'Severe Penicillin allergy. Carry Epinephrine if traveling. Emergency contacts listed below.',
          healthProfile: {
            create: {
              bloodGroup: 'O+',
              height: 175.5,
              weight: 72.0,
              allergiesSummary: 'Penicillin (Severe anaphylactic risk)',
              conditionsSummary: 'Mild Essential Hypertension',
              medicinesSummary: 'Telmisartan 40mg (Once daily morning), Multivitamin daily',
              emergencyNotes: 'Blood Group O+. Severe allergy to Penicillin/Amoxicillin.',
            },
          },
          conditions: {
            create: [
              {
                conditionName: 'Mild Essential Hypertension',
                diagnosedDate: '2023-04-12',
                status: 'ACTIVE',
                doctorName: 'Dr. Ananya Sharma',
                hospitalName: 'Apollo Health City',
                notes: 'Controlled with daily ACE inhibitor/ARB medication and low sodium diet.',
              },
            ],
          },
          allergies: {
            create: [
              {
                allergen: 'Penicillin & Beta-Lactam Antibiotics',
                allergyType: 'Drug',
                severity: 'SEVERE',
                reaction: 'Anaphylaxis, hives, bronchospasm',
                diagnosedDate: '2015-09-20',
                notes: 'Strictly avoid all penicillin derivatives, augmentin and amoxicillin.',
              },
              {
                allergen: 'Dust Mites',
                allergyType: 'Environmental',
                severity: 'MILD',
                reaction: 'Sneezing, mild allergic rhinitis',
                diagnosedDate: '2018-02-10',
                notes: 'Seasonal flareups in winter.',
              },
            ],
          },
          medications: {
            create: [
              {
                medicineName: 'Telmisartan 40 mg',
                dosage: '40 mg',
                frequency: 'Once Daily',
                timingSlot: 'MORNING',
                duration: 'Ongoing (30 Days Pack)',
                instructions: 'Take in the morning with a glass of water after breakfast',
                startDate: '2024-02-01',
                status: 'ACTIVE',
              },
              {
                medicineName: 'Atorvastatin 10 mg',
                dosage: '10 mg',
                frequency: 'Once Daily',
                timingSlot: 'NIGHT',
                duration: 'Ongoing (30 Days Pack)',
                instructions: 'Take after dinner before sleep',
                startDate: '2024-02-01',
                status: 'ACTIVE',
              },
              {
                medicineName: 'Vitamin D3 60,000 IU',
                dosage: '60,000 IU',
                frequency: 'Once Weekly',
                timingSlot: 'AFTERNOON',
                duration: '8 Weeks',
                instructions: 'Take with milk after lunch every Sunday',
                startDate: '2024-03-01',
                status: 'ACTIVE',
              },
            ],
          },
        },
      },
    },
    include: {
      patient: {
        include: {
          healthProfile: true,
          conditions: true,
          allergies: true,
          medications: true,
        },
      },
    },
  });

  const rahulPatient = patientUserRahul.patient!;

  // 6. Create Patient Mohith (Friend & Emergency contact for Rahul)
  // Explaining the rule: Mohith = Patient. Rahul adds Mohith as emergency contact.
  // Mohith does NOT automatically receive Rahul's complete medical records!
  const patientUserMohith = await prisma.user.create({
    data: {
      email: 'mohith.varma@example.com',
      mobile: '9876543211',
      role: 'PATIENT',
      status: 'ACTIVE',
      preferredLanguage: 'en',
      patient: {
        create: {
          healthId: 'HP-100246',
          fullName: 'Mohith Varma',
          dob: '1993-09-22',
          gender: 'Male',
          bloodGroup: 'B+',
          address: 'Plot 104, Hitec City, Kondapur',
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          pincode: '500084',
          govtIdType: 'Aadhaar',
          govtIdNumberMasked: 'XXXX-XXXX-4532',
          identityStatus: 'VERIFIED',
          identityVerifiedAt: new Date('2024-01-15T12:00:00Z'),
          height: 180.0,
          weight: 76.5,
          emergencyNotes: 'No known drug allergies.',
          healthProfile: {
            create: {
              bloodGroup: 'B+',
              height: 180.0,
              weight: 76.5,
              allergiesSummary: 'None reported',
              conditionsSummary: 'None',
              medicinesSummary: 'None',
            },
          },
        },
      },
    },
    include: { patient: true },
  });

  const mohithPatient = patientUserMohith.patient!;

  // Add Mohith as Rahul's Primary Emergency Contact
  await prisma.emergencyContact.create({
    data: {
      patientId: rahulPatient.id,
      name: 'Mohith Varma',
      relationship: 'Friend / Trusted Nominee',
      phone: '+91 9876543211',
      email: 'mohith.varma@example.com',
      isRegisteredPatient: true,
      registeredPatientId: mohithPatient.id,
      isPrimary: true,
    },
  });

  // Secondary Emergency Contact (Family)
  await prisma.emergencyContact.create({
    data: {
      patientId: rahulPatient.id,
      name: 'Sneha Sharma',
      relationship: 'Spouse',
      phone: '+91 9876543299',
      email: 'sneha.sharma@example.com',
      isRegisteredPatient: false,
      isPrimary: false,
    },
  });

  console.log('👤 Created Patients Rahul (HP-100245) & Mohith (HP-100246) + Emergency Contacts.');

  // 7. Create Rahul's Upcoming Appointment with Dr. Ananya Sharma
  const upcomingAppointment = await prisma.appointment.create({
    data: {
      appointmentNumber: 'APT-4521',
      patientId: rahulPatient.id,
      doctorId: doctorUser1.doctor!.id,
      hospitalId: hospitalApollo.id,
      department: 'Cardiology',
      date: '2026-09-20',
      timeSlot: '10:30 AM',
      appointmentType: 'IN_PERSON',
      reason: 'Routine 6-month blood pressure review & lipid checkup',
      status: 'CONFIRMED',
      notes: 'Patient advised to bring recent lipid profile report.',
    },
  });

  // 8. Create Consultation History for Rahul by Dr. Ananya Sharma
  const consultationCanonical = {
    consultationNumber: 'CON-8901',
    patientHealthId: 'HP-100245',
    doctorRegNumber: 'MCI-CARD-2018-8472',
    hospital: 'Apollo Health City',
    date: '2024-02-01',
    vitals: { bp: '128/82 mmHg', pulse: '74 bpm', temp: '98.4 F', spo2: '99%' },
    diagnosis: 'Mild Essential Hypertension (Stable)',
    treatmentPlan: 'Continue Telmisartan 40mg daily morning. Regular morning walk 30 mins.',
  };
  const consultationHash = calculateSha256(consultationCanonical);
  const consultationTxId = '0x' + crypto.randomBytes(32).toString('hex');

  const consultation1 = await prisma.consultation.create({
    data: {
      consultationNumber: 'CON-8901',
      patientId: rahulPatient.id,
      doctorId: doctorUser1.doctor!.id,
      hospitalId: hospitalApollo.id,
      date: '2024-02-01',
      time: '11:00 AM',
      consultationType: 'IN_PERSON',
      symptoms: 'Occasional mild headache after stress, routine cardiac follow-up',
      observations: 'Chest clear bilaterally, S1 S2 heard normal, no pedal edema.',
      vitalsJson: JSON.stringify(consultationCanonical.vitals),
      diagnosis: 'Mild Essential Hypertension (Well Controlled)',
      treatmentPlan: 'Maintain current Telmisartan dosage, monitor BP weekly, maintain low-sodium diet.',
      clinicalNotes: 'Patient adhering well to lifestyle modifications. Next review in 6 months.',
      followUpDate: '2024-08-01',
      status: 'COMPLETED',
      recordHash: consultationHash,
      blockchainTxId: consultationTxId,
      blockchainStatus: 'VERIFIED',
    },
  });

  // Register Blockchain Proof for Consultation
  await prisma.blockchainProof.create({
    data: {
      recordId: consultation1.id,
      recordType: 'CONSULTATION',
      eventType: 'RECORD_CREATED',
      canonicalHash: consultationHash,
      transactionId: consultationTxId,
      blockNumber: 10421,
      network: 'Hardhat-Local-EVM',
      status: 'CONFIRMED',
      recordedBy: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      timestamp: new Date('2024-02-01T11:30:00Z'),
    },
  });

  // 9. Create Prescription for Rahul by Dr. Ananya Sharma
  const rxCanonical = {
    prescriptionNumber: 'RX-100245',
    patientHealthId: 'HP-100245',
    doctor: 'Dr. Ananya Sharma',
    date: '2024-02-01',
    medicines: [
      { name: 'Telmisartan', dose: '40mg', freq: 'Once daily (Morning)' },
      { name: 'Atorvastatin', dose: '10mg', freq: 'Once daily (Night)' },
    ],
  };
  const rxHash = calculateSha256(rxCanonical);
  const rxTxId = '0x' + crypto.randomBytes(32).toString('hex');

  const prescription1 = await prisma.prescription.create({
    data: {
      prescriptionNumber: 'RX-100245',
      patientId: rahulPatient.id,
      doctorId: doctorUser1.doctor!.id,
      hospitalId: hospitalApollo.id,
      consultationId: consultation1.id,
      diagnosis: 'Essential Hypertension & Mild Dyslipidemia',
      notes: 'Take Telmisartan morning with food. Take Atorvastatin at bedtime.',
      recordHash: rxHash,
      blockchainTxId: rxTxId,
      blockchainStatus: 'VERIFIED',
      medicines: {
        create: [
          {
            medicineName: 'Telmisartan',
            dosage: '40mg',
            frequency: 'Once Daily',
            timingMorning: true,
            duration: '30 Days',
            instructions: 'Take with water after breakfast',
          },
          {
            medicineName: 'Atorvastatin',
            dosage: '10mg',
            frequency: 'Once Daily',
            timingNight: true,
            duration: '30 Days',
            instructions: 'Take after dinner before sleeping',
          },
        ],
      },
    },
  });

  // Register Blockchain Proof for Prescription
  await prisma.blockchainProof.create({
    data: {
      recordId: prescription1.id,
      recordType: 'PRESCRIPTION',
      eventType: 'RECORD_CREATED',
      canonicalHash: rxHash,
      transactionId: rxTxId,
      blockNumber: 10422,
      network: 'Hardhat-Local-EVM',
      status: 'CONFIRMED',
      recordedBy: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      timestamp: new Date('2024-02-01T11:35:00Z'),
    },
  });

  // 10. Create Lab Reports for Rahul
  const labCanonical = {
    reportNumber: 'LR-2031',
    patientHealthId: 'HP-100245',
    testName: 'Complete Lipid Profile',
    laboratory: 'Apollo Diagnostics Laboratory',
    date: '2024-01-28',
    results: {
      totalCholesterol: '185 mg/dL (Normal < 200)',
      triglycerides: '142 mg/dL (Normal < 150)',
      hdlCholesterol: '48 mg/dL (Normal > 40)',
      ldlCholesterol: '108 mg/dL (Optimal < 100)',
    },
  };
  const labHash = calculateSha256(labCanonical);
  const labTxId = '0x' + crypto.randomBytes(32).toString('hex');

  const labReport1 = await prisma.labReport.create({
    data: {
      reportNumber: 'LR-2031',
      patientId: rahulPatient.id,
      doctorId: doctorUser1.doctor!.id,
      hospitalId: hospitalApollo.id,
      testName: 'Complete Lipid Profile',
      category: 'Biochemistry / Pathology',
      sampleDate: '2024-01-27',
      resultDate: '2024-01-28',
      laboratoryName: 'Apollo Diagnostics Laboratory',
      technicianName: 'Suresh Rao, Senior Biochemist',
      summary: 'Lipid parameters generally within reference interval with mild borderline LDL elevation.',
      findingsJson: JSON.stringify(labCanonical.results),
      status: 'COMPLETED',
      fileUrl: '/mock-reports/LR-2031-LipidProfile.pdf',
      fileType: 'application/pdf',
      fileSize: '1.4 MB',
      canonicalDataJson: JSON.stringify(labCanonical),
      recordHash: labHash,
      blockchainTxId: labTxId,
      blockchainStatus: 'VERIFIED',
    },
  });

  // Second Lab Report: CBC
  const cbcCanonical = {
    reportNumber: 'LR-2032',
    patientHealthId: 'HP-100245',
    testName: 'Complete Blood Count (CBC)',
    laboratory: 'Apollo Central Pathology',
    date: '2024-01-28',
    results: {
      hemoglobin: '15.2 g/dL (Normal 13.5 - 17.5)',
      wbcCount: '7,400 /mcL (Normal 4,500 - 11,000)',
      plateletCount: '240,000 /mcL (Normal 150,000 - 450,000)',
    },
  };
  const cbcHash = calculateSha256(cbcCanonical);
  const cbcTxId = '0x' + crypto.randomBytes(32).toString('hex');

  const labReport2 = await prisma.labReport.create({
    data: {
      reportNumber: 'LR-2032',
      patientId: rahulPatient.id,
      doctorId: doctorUser1.doctor!.id,
      hospitalId: hospitalApollo.id,
      testName: 'Complete Blood Count (CBC)',
      category: 'Hematology',
      sampleDate: '2024-01-27',
      resultDate: '2024-01-28',
      laboratoryName: 'Apollo Central Pathology',
      technicianName: 'Meenakshi Iyer, Chief Technologist',
      summary: 'All hematological parameters within normal physiological limits.',
      findingsJson: JSON.stringify(cbcCanonical.results),
      status: 'COMPLETED',
      fileUrl: '/mock-reports/LR-2032-CBC.pdf',
      fileType: 'application/pdf',
      fileSize: '1.1 MB',
      canonicalDataJson: JSON.stringify(cbcCanonical),
      recordHash: cbcHash,
      blockchainTxId: cbcTxId,
      blockchainStatus: 'VERIFIED',
    },
  });

  await prisma.blockchainProof.create({
    data: {
      recordId: labReport1.id,
      recordType: 'LAB_REPORT',
      eventType: 'RECORD_CREATED',
      canonicalHash: labHash,
      transactionId: labTxId,
      blockNumber: 10423,
      network: 'Hardhat-Local-EVM',
      status: 'CONFIRMED',
      recordedBy: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      timestamp: new Date('2024-01-28T16:00:00Z'),
    },
  });

  await prisma.blockchainProof.create({
    data: {
      recordId: labReport2.id,
      recordType: 'LAB_REPORT',
      eventType: 'RECORD_CREATED',
      canonicalHash: cbcHash,
      transactionId: cbcTxId,
      blockNumber: 10424,
      network: 'Hardhat-Local-EVM',
      status: 'CONFIRMED',
      recordedBy: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      timestamp: new Date('2024-01-28T16:15:00Z'),
    },
  });

  console.log('📑 Created Consultation, Prescription & Lab Reports with Blockchain Proofs.');

  // 11. Create Active Access Permission for Dr. Ananya Sharma
  // Rahul approved Dr. Ananya Sharma for 30 days
  const accessRequest1 = await prisma.accessRequest.create({
    data: {
      patientId: rahulPatient.id,
      doctorId: doctorUser1.doctor!.id,
      hospitalId: hospitalApollo.id,
      reason: 'Ongoing clinical management of cardiovascular health & medication titration',
      scopeJson: JSON.stringify(['CONSULTATIONS', 'PRESCRIPTIONS', 'LAB_REPORTS', 'ALLERGIES', 'MEDICINES']),
      requestedDuration: '30_DAYS',
      durationDays: 30,
      status: 'APPROVED',
      expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // ~25 days remaining
    },
  });

  const permissionProofHash = calculateSha256({
    permissionType: 'EMR_ACCESS_GRANT',
    patientHealthId: 'HP-100245',
    doctorRegNumber: 'MCI-CARD-2018-8472',
    scope: ['CONSULTATIONS', 'PRESCRIPTIONS', 'LAB_REPORTS', 'ALLERGIES', 'MEDICINES'],
  });
  const permTxId = '0x' + crypto.randomBytes(32).toString('hex');

  await prisma.permission.create({
    data: {
      patientId: rahulPatient.id,
      doctorId: doctorUser1.doctor!.id,
      hospitalId: hospitalApollo.id,
      accessRequestId: accessRequest1.id,
      scopeJson: JSON.stringify(['CONSULTATIONS', 'PRESCRIPTIONS', 'LAB_REPORTS', 'ALLERGIES', 'MEDICINES']),
      approvedScope: 'Consultations, Prescriptions, Lab Reports, Allergies, Medicines',
      startDate: new Date(),
      expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      approvedAt: new Date(),
      blockchainProofId: permTxId,
    },
  });

  await prisma.blockchainProof.create({
    data: {
      recordId: accessRequest1.id,
      recordType: 'ACCESS_PERMISSION',
      eventType: 'ACCESS_GRANTED',
      canonicalHash: permissionProofHash,
      transactionId: permTxId,
      blockNumber: 10425,
      network: 'Hardhat-Local-EVM',
      status: 'CONFIRMED',
      recordedBy: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      timestamp: new Date(),
    },
  });

  // Pending access request from Dr. Rajesh Verma (Neurology)
  await prisma.accessRequest.create({
    data: {
      patientId: rahulPatient.id,
      doctorId: doctorUser2.doctor!.id,
      hospitalId: hospitalCare.id,
      reason: 'Evaluation of persistent tension headache and neurological assessment',
      scopeJson: JSON.stringify(['CONSULTATIONS', 'MEDICAL_HISTORY', 'LAB_REPORTS']),
      requestedDuration: '7_DAYS',
      durationDays: 7,
      status: 'PENDING',
    },
  });

  console.log('🔑 Created Access Requests and Active Permission.');

  // 12. Create Granular Audit Events (Exact requirement: individual sensitive actions)
  const auditLogs = [
    {
      actorId: doctorUser1.id,
      actorRole: 'DOCTOR',
      actorName: 'Dr. Ananya Sharma',
      patientId: rahulPatient.id,
      patientHealthId: 'HP-100245',
      doctorId: doctorUser1.doctor!.id,
      doctorName: 'Dr. Ananya Sharma',
      hospitalId: hospitalApollo.id,
      hospitalName: 'Apollo Health City',
      department: 'Cardiology',
      documentId: rahulPatient.allergies[0].id,
      documentType: 'ALLERGY',
      action: 'VIEW',
      accessType: 'NORMAL',
      reason: 'Pre-prescription allergy safety review',
      authorizationStatus: 'AUTHORIZED',
      consentStatus: 'EXPLICIT_CONSENT',
      result: 'SUCCESS',
      severity: 'LOW',
      timestamp: new Date('2024-02-01T11:05:15Z'),
    },
    {
      actorId: doctorUser1.id,
      actorRole: 'DOCTOR',
      actorName: 'Dr. Ananya Sharma',
      patientId: rahulPatient.id,
      patientHealthId: 'HP-100245',
      doctorId: doctorUser1.doctor!.id,
      doctorName: 'Dr. Ananya Sharma',
      hospitalId: hospitalApollo.id,
      hospitalName: 'Apollo Health City',
      department: 'Cardiology',
      documentId: rahulPatient.medications[0].id,
      documentType: 'MEDICATION',
      action: 'VIEW',
      accessType: 'NORMAL',
      reason: 'Reviewing current antihypertensive adherence',
      authorizationStatus: 'AUTHORIZED',
      consentStatus: 'EXPLICIT_CONSENT',
      result: 'SUCCESS',
      severity: 'LOW',
      timestamp: new Date('2024-02-01T11:05:42Z'),
    },
    {
      actorId: doctorUser1.id,
      actorRole: 'DOCTOR',
      actorName: 'Dr. Ananya Sharma',
      patientId: rahulPatient.id,
      patientHealthId: 'HP-100245',
      doctorId: doctorUser1.doctor!.id,
      doctorName: 'Dr. Ananya Sharma',
      hospitalId: hospitalApollo.id,
      hospitalName: 'Apollo Health City',
      department: 'Cardiology',
      documentId: prescription1.id,
      documentType: 'PRESCRIPTION',
      action: 'VIEW',
      accessType: 'NORMAL',
      reason: 'Viewing previous prescription history',
      authorizationStatus: 'AUTHORIZED',
      consentStatus: 'EXPLICIT_CONSENT',
      result: 'SUCCESS',
      severity: 'LOW',
      timestamp: new Date('2024-02-01T11:06:08Z'),
    },
    {
      actorId: doctorUser1.id,
      actorRole: 'DOCTOR',
      actorName: 'Dr. Ananya Sharma',
      patientId: rahulPatient.id,
      patientHealthId: 'HP-100245',
      doctorId: doctorUser1.doctor!.id,
      doctorName: 'Dr. Ananya Sharma',
      hospitalId: hospitalApollo.id,
      hospitalName: 'Apollo Health City',
      department: 'Cardiology',
      documentId: labReport1.id,
      documentType: 'LAB_REPORT',
      action: 'VIEW',
      accessType: 'NORMAL',
      reason: 'Reviewing lipid panel values during consultation',
      authorizationStatus: 'AUTHORIZED',
      consentStatus: 'EXPLICIT_CONSENT',
      result: 'SUCCESS',
      severity: 'LOW',
      timestamp: new Date('2024-02-01T11:06:30Z'),
    },
    {
      actorId: doctorUser1.id,
      actorRole: 'DOCTOR',
      actorName: 'Dr. Ananya Sharma',
      patientId: rahulPatient.id,
      patientHealthId: 'HP-100245',
      doctorId: doctorUser1.doctor!.id,
      doctorName: 'Dr. Ananya Sharma',
      hospitalId: hospitalApollo.id,
      hospitalName: 'Apollo Health City',
      department: 'Cardiology',
      documentId: labReport1.id,
      documentType: 'LAB_REPORT',
      action: 'DOWNLOAD',
      accessType: 'NORMAL',
      reason: 'Exporting laboratory summary for patient consultation record',
      authorizationStatus: 'AUTHORIZED',
      consentStatus: 'EXPLICIT_CONSENT',
      result: 'SUCCESS',
      severity: 'LOW',
      timestamp: new Date('2024-02-01T11:07:10Z'),
    },
    {
      actorId: doctorUser1.id,
      actorRole: 'DOCTOR',
      actorName: 'Dr. Ananya Sharma',
      patientId: rahulPatient.id,
      patientHealthId: 'HP-100245',
      doctorId: doctorUser1.doctor!.id,
      doctorName: 'Dr. Ananya Sharma',
      hospitalId: hospitalApollo.id,
      hospitalName: 'Apollo Health City',
      department: 'Cardiology',
      documentId: prescription1.id,
      documentType: 'PRESCRIPTION',
      action: 'CREATE',
      accessType: 'NORMAL',
      reason: 'Generated e-prescription RX-100245 with blockchain cryptographic seal',
      authorizationStatus: 'AUTHORIZED',
      consentStatus: 'EXPLICIT_CONSENT',
      blockchainTxId: rxTxId,
      blockchainVerificationStatus: 'VERIFIED',
      result: 'SUCCESS',
      severity: 'LOW',
      timestamp: new Date('2024-02-01T11:35:00Z'),
    },
  ];

  for (const log of auditLogs) {
    await prisma.auditEvent.create({ data: log });
  }

  console.log('📜 Created Granular Append-Only Audit Events.');

  // 13. Create Historical Emergency Session (Demonstrating emergency workflow)
  const emgNote = 'Patient presented at emergency department with severe acute palpitations. Evaluated cardiac rhythm (Sinus tachycardia, 118 bpm). Administered oral beta blocker under supervision. Vitals stabilized. Advised outpatient cardiology follow-up.';
  const emgNoteHash = calculateSha256(emgNote);
  const emgTxId = '0x' + crypto.randomBytes(32).toString('hex');

  const emergencySession1 = await prisma.emergencySession.create({
    data: {
      sessionNumber: 'EMG-7801',
      patientId: rahulPatient.id,
      doctorId: doctorUser1.doctor!.id,
      hospitalId: hospitalApollo.id,
      reason: 'Acute emergency: Patient collapsed in triage with tachycardia and dizziness',
      doctorVerified: true,
      hospitalVerified: true,
      startTime: new Date('2023-11-14T22:15:00Z'),
      endTime: new Date('2023-11-14T23:45:00Z'),
      autoExpiryTime: new Date('2023-11-15T02:15:00Z'),
      status: 'ENDED_MANUALLY',
      emergencyTreatmentNote: emgNote,
      treatmentNoteHash: emgNoteHash,
      blockchainTxId: emgTxId,
    },
  });

  // Blockchain proof for Emergency Note
  await prisma.blockchainProof.create({
    data: {
      recordId: emergencySession1.id,
      recordType: 'EMERGENCY_NOTE',
      eventType: 'EMERGENCY_ACCESS',
      canonicalHash: emgNoteHash,
      transactionId: emgTxId,
      blockNumber: 10426,
      network: 'Hardhat-Local-EVM',
      status: 'CONFIRMED',
      recordedBy: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      timestamp: new Date('2023-11-14T23:30:00Z'),
    },
  });

  // Emergency Audit Event
  await prisma.auditEvent.create({
    data: {
      actorId: doctorUser1.id,
      actorRole: 'DOCTOR',
      actorName: 'Dr. Ananya Sharma',
      patientId: rahulPatient.id,
      patientHealthId: 'HP-100245',
      doctorId: doctorUser1.doctor!.id,
      doctorName: 'Dr. Ananya Sharma',
      hospitalId: hospitalApollo.id,
      hospitalName: 'Apollo Health City',
      department: 'Emergency Medicine',
      documentId: emergencySession1.id,
      documentType: 'EMERGENCY_NOTE',
      action: 'EMERGENCY_ACCESS',
      accessType: 'EMERGENCY',
      reason: 'Immediate life-safety bypass: Acute palpitations & tachycardia',
      authorizationStatus: 'EMERGENCY_OVERRIDE',
      consentStatus: 'EMERGENCY_BYPASS',
      sessionId: emergencySession1.sessionNumber,
      blockchainTxId: emgTxId,
      blockchainVerificationStatus: 'VERIFIED',
      result: 'SUCCESS',
      severity: 'HIGH',
      timestamp: new Date('2023-11-14T22:15:00Z'),
    },
  });

  console.log('🚨 Created Emergency Session and Audit Entry.');

  // 14. Create Sample Security Alerts (For Admin Security Center)
  await prisma.securityAlert.create({
    data: {
      alertType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      severity: 'MEDIUM',
      title: 'Unregistered Provider Access Request Rejected',
      description: 'An unverified external IP attempted to query patient records without an active cryptographic session.',
      actorName: 'External Client (198.51.100.24)',
      patientId: rahulPatient.id,
      reason: 'Failed HMAC validation and missing access permission token',
      status: 'REVIEWED',
      resolutionNotes: 'IP blocked at API gateway rate-limiter. No data compromised.',
    },
  });

  // 15. Create Notifications for Rahul
  const notifications = [
    {
      userId: patientUserRahul.id,
      title: 'Upcoming Appointment Reminder',
      message: 'You have a scheduled consultation with Dr. Ananya Sharma (Cardiology) on Sep 20 at 10:30 AM.',
      type: 'APPOINTMENT',
      category: 'APPOINTMENT',
      priority: 'NORMAL',
      linkRoute: '/patient/appointments',
      isRead: false,
    },
    {
      userId: patientUserRahul.id,
      title: 'Pending Doctor Access Request',
      message: 'Dr. Rajesh Verma (Neurology, Care Multispecialty) requested 7-day access to your consultations and lab reports.',
      type: 'DOCTOR_ACCESS',
      category: 'ACCESS_REQUEST',
      priority: 'HIGH',
      linkRoute: '/patient/access-permissions',
      isRead: false,
    },
    {
      userId: patientUserRahul.id,
      title: 'Blockchain Verification Confirmed',
      message: 'Your laboratory report LR-2031 has been cryptographically confirmed on the EVM blockchain.',
      type: 'SECURITY',
      category: 'BLOCKCHAIN',
      priority: 'NORMAL',
      linkRoute: '/patient/security',
      isRead: true,
    },
  ];

  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }

  console.log('🔔 Created Notifications.');
  console.log('✅ EMR Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
