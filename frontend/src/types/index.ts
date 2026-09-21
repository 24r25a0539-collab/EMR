export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type LanguageCode = 'en' | 'te' | 'hi' | 'kn' | 'ta' | 'mr';

export interface User {
  id: string;
  email: string | null;
  mobile: string | null;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  preferredLanguage?: LanguageCode;
  patient?: Patient;
  doctor?: Doctor;
  admin?: Admin;
  name?: string;
  healthId?: string;
  phone?: string;
  profilePhoto?: string | null;
}

export interface Patient {
  id: string;
  userId: string;
  healthId: string;
  healthcareId?: string;
  fullName: string;
  dob: string;
  age?: number;
  gender: string;
  bloodGroup: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  govtIdType: string;
  govtIdNumber?: string;
  govtIdNumberMasked: string;
  identityStatus: 'VERIFIED' | 'PENDING' | 'FAILED';
  identityVerifiedAt?: string;
  height?: number;
  weight?: number;
  emergencyNotes?: string;
  profilePhoto?: string | null;
  identificationMarks?: string[];
  abhaId?: string;
  mobile?: string;
  email?: string;
  createdAt?: string;
  healthProfile?: HealthProfile;
  emergencyContacts?: EmergencyContact[];
  conditions?: MedicalCondition[];
  allergies?: Allergy[];
  medications?: Medication[];
}

export interface HealthProfile {
  id: string;
  patientId: string;
  bloodGroup: string;
  height?: number;
  weight?: number;
  allergiesSummary?: string;
  conditionsSummary?: string;
  medicinesSummary?: string;
  emergencyNotes?: string;
  lastUpdated: string;
}

export interface MedicalCondition {
  id: string;
  patientId: string;
  conditionName: string;
  diagnosedDate: string;
  status: 'ACTIVE' | 'RESOLVED' | 'CHRONIC';
  doctorName?: string;
  hospitalName?: string;
  notes?: string;
}

export interface Allergy {
  id: string;
  patientId: string;
  allergen: string;
  allergyType: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';
  reaction?: string;
  diagnosedDate?: string;
  notes?: string;
}

export interface Medication {
  id: string;
  patientId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  timingSlot: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  duration?: string;
  instructions?: string;
  startDate: string;
  status: 'ACTIVE' | 'TAKEN' | 'SKIPPED' | 'SNOOZED' | 'PAUSED' | 'COMPLETED';
  prescriptionId?: string;
  lastActionDate?: string;
}

export interface Doctor {
  id: string;
  userId: string;
  fullName: string;
  registrationNumber: string;
  specialization: string;
  qualifications: string;
  experienceYears: number;
  hospitalAffiliation?: string;
  department?: string;
  languages: string;
  profilePhoto?: string;
  govtIdStatus: string;
  degreeStatus: string;
  experienceDocStatus: string;
  regStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'EXPIRED';
  rejectionReason?: string;
  verificationNotes?: string;
  workingDays: string;
  workingHours: string;
  appointmentDuration: number;
  consultationTypes: string;
  affiliations?: DoctorHospitalAffiliation[];
  doctorIdNumber?: string;
  authority?: string;
  authorityType?: string;
  registrationState?: string;
  govMatchStatus?: string;
  qualification?: string;
  email?: string;
  mobile?: string;
  dob?: string;
  gender?: string;
}

export interface DoctorHospitalAffiliation {
  id: string;
  doctorId: string;
  hospitalId: string;
  department: string;
  role: string;
  startDate: string;
  status: string;
  hospital?: Hospital;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  emergencyAvailable: boolean;
  emergencyPhone?: string;
  hours: string;
  status: string;
  verified: boolean;
  type: string;
  departments?: HospitalDepartment[];
}

export interface HospitalDepartment {
  id: string;
  name: string;
  description?: string;
  headDoctor?: string;
}

export interface Admin {
  id: string;
  userId: string;
  fullName: string;
  department: string;
  roleTitle: string;
}

export interface Consultation {
  id: string;
  consultationNumber: string;
  appointmentId?: string;
  patientId: string;
  doctorId: string;
  hospitalId?: string;
  date: string;
  time: string;
  consultationType: string;
  symptoms: string;
  observations: string;
  vitalsJson?: string;
  diagnosis: string;
  treatmentPlan: string;
  clinicalNotes?: string;
  followUpDate?: string;
  status: string;
  recordHash: string;
  blockchainTxId?: string;
  blockchainStatus: 'VERIFIED' | 'PENDING' | 'INTEGRITY_FAILURE';
  doctor?: Doctor;
  hospital?: Hospital;
  prescriptions?: Prescription[];
}

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  doctorId: string;
  hospitalId?: string;
  consultationId?: string;
  diagnosis: string;
  notes?: string;
  recordHash: string;
  blockchainTxId?: string;
  blockchainStatus: 'VERIFIED' | 'PENDING' | 'INTEGRITY_FAILURE';
  createdAt: string;
  doctor?: Doctor;
  hospital?: Hospital;
  medicines?: PrescriptionMedicine[];
}

export interface PrescriptionMedicine {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  timingMorning: boolean;
  timingAfternoon: boolean;
  timingEvening: boolean;
  timingNight: boolean;
  duration: string;
  instructions?: string;
}

export interface LabReport {
  id: string;
  reportNumber: string;
  patientId: string;
  doctorId?: string;
  hospitalId?: string;
  testName: string;
  category: string;
  sampleDate: string;
  resultDate: string;
  laboratoryName: string;
  technicianName?: string;
  summary: string;
  findingsJson?: string;
  status: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: string;
  recordHash: string;
  blockchainTxId?: string;
  blockchainStatus: 'VERIFIED' | 'PENDING' | 'INTEGRITY_FAILURE';
  doctor?: Doctor;
  hospital?: Hospital;
}

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  department: string;
  date: string;
  timeSlot: string;
  appointmentType: 'IN_PERSON' | 'ONLINE';
  reason: string;
  status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  notes?: string;
  doctor?: Doctor;
  hospital?: Hospital;
}

export interface AccessRequest {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId?: string;
  reason: string;
  scopeJson: string;
  requestedDuration: string;
  durationDays: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REVOKED';
  rejectionReason?: string;
  expiresAt?: string;
  createdAt: string;
  doctor?: Doctor;
  patient?: Patient;
}

export interface Permission {
  id: string;
  patientId: string;
  doctorId: string;
  hospitalId?: string;
  accessRequestId?: string;
  scopeJson: string;
  approvedScope: string;
  startDate: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  approvedAt: string;
  blockchainProofId?: string;
  doctor?: Doctor;
}

export interface EmergencyContact {
  id: string;
  patientId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isRegisteredPatient: boolean;
  registeredPatientId?: string;
  isPrimary: boolean;
}

export interface EmergencySession {
  id: string;
  sessionNumber: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  reason: string;
  startTime: string;
  endTime?: string;
  autoExpiryTime: string;
  status: 'ACTIVE' | 'ENDED_MANUALLY' | 'EXPIRED';
  emergencyTreatmentNote?: string;
  treatmentNoteHash?: string;
  blockchainTxId?: string;
  patient?: Patient;
  doctor?: Doctor;
  hospital?: Hospital;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorRole: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'SYSTEM';
  actorName: string;
  patientId?: string;
  patientHealthId?: string;
  doctorId?: string;
  doctorName?: string;
  hospitalId?: string;
  hospitalName?: string;
  department?: string;
  recordId?: string;
  documentId?: string;
  documentType?: string;
  action: string;
  accessType: string;
  reason?: string;
  authorizationStatus: string;
  consentStatus: string;
  timestamp: string;
  sessionId?: string;
  previousHash?: string;
  newHash?: string;
  blockchainTxId?: string;
  blockchainVerificationStatus: string;
  result: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SecurityAlert {
  id: string;
  alertType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  actorName?: string;
  patientId?: string;
  recordId?: string;
  reason?: string;
  expectedHash?: string;
  actualHash?: string;
  blockchainTxId?: string;
  status: 'NEW' | 'INVESTIGATING' | 'REVIEWED' | 'RESOLVED';
  createdAt: string;
}

export interface BlockchainProof {
  id: string;
  recordId: string;
  recordType: string;
  eventType: string;
  canonicalHash: string;
  transactionId: string;
  blockNumber: number;
  network: string;
  status: string;
  recordedBy: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  category: string;
  priority: 'NORMAL' | 'HIGH' | 'CRITICAL';
  isRead: boolean;
  linkRoute?: string;
  createdAt: string;
}
