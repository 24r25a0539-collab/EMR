/**
 * Patient Authentication & Registration Service (Apex EMR)
 *
 * Frontend service managing:
 * 1. Multi-step Patient Registration
 * 2. 3-Method Patient Login (Healthcare ID, Mobile Number, ABHA ID)
 * 3. Masked Aadhaar storage (NEVER stores full Aadhaar in localStorage/sessionStorage)
 * 4. Unique Healthcare ID generation
 * 5. Mock OTP generation & verification
 */

export type GenderType = 'Male' | 'Female' | 'Other' | 'Prefer not to say';

export type BloodGroupType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type RelationshipType =
  | 'Parent'
  | 'Spouse'
  | 'Sibling'
  | 'Child'
  | 'Relative'
  | 'Friend'
  | 'Other';

export interface EmergencyContactData {
  fullName: string;
  relationship: RelationshipType | string;
  mobileNumber: string;
  email?: string;
  address?: string;
}

export interface PatientRegistrationInput {
  mobileNumber: string;
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: GenderType;
  address: string;
  email?: string;
  bloodGroup: BloodGroupType | string;
  emergencyContact: EmergencyContactData;
  aadhaarNumber: string; // Plaintext 12 digits from form, will be converted to masked
  abhaId?: string;
}

export interface StoredPatientRecord {
  healthcareId: string; // "HP-100246"
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: GenderType;
  address: string;
  email?: string;
  mobileNumber: string;
  bloodGroup: string;
  maskedAadhaar: string; // "•••• •••• 1234" - NEVER full Aadhaar!
  abhaId?: string;
  emergencyContact: EmergencyContactData;
  mobileVerified: boolean;
  registrationStatus: 'ACTIVE';
  createdAt: string;
  profilePhoto?: string;
}

const STORAGE_KEY = 'apex_registered_patients';

// Empty by default - PostgreSQL is the single source of truth
const INITIAL_PATIENTS: StoredPatientRecord[] = [];

class PatientAuthService {
  /**
   * Calculate Age from Date of Birth string (YYYY-MM-DD)
   */
  calculateAge(dobString: string): number {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return 0;

    const today = new Date('2026-09-15'); // Anchor to current app context
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return Math.max(0, age);
  }

  /**
   * Mask Aadhaar number: takes 12 digits, returns "•••• •••• 1234"
   * Full Aadhaar is NEVER persisted.
   */
  maskAadhaar(aadhaar: string): string {
    const clean = aadhaar.replace(/\D/g, '');
    if (clean.length < 4) return '•••• •••• ••••';
    const last4 = clean.slice(-4);
    return `•••• •••• ${last4}`;
  }

  /**
   * Generate a unique Healthcare ID (e.g. "HP-100246")
   */
  generateHealthcareId(): string {
    const existing = this.getAllPatients();
    const existingIds = new Set(existing.map((p) => p.healthcareId.toUpperCase()));

    let candidate = '';
    let counter = 100246;
    while (!candidate || existingIds.has(candidate)) {
      candidate = `HP-${counter}`;
      counter++;
      if (counter > 999999) {
        candidate = `HP-${Math.floor(100000 + Math.random() * 900000)}`;
      }
    }
    return candidate;
  }

  /**
   * Get all registered patients from local state / localStorage
   */
  getAllPatients(): StoredPatientRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((p: StoredPatientRecord) => p.fullName !== 'Rahul Sharma' && p.fullName !== 'Priya Patel');
        }
      }
    } catch {}

    return [];
  }

  /**
   * Save a newly registered patient
   * STRICT SECURITY: Aadhaar is only saved in masked form! Full Aadhaar is discarded.
   */
  registerPatient(input: PatientRegistrationInput): {
    success: boolean;
    patient?: StoredPatientRecord;
    error?: string;
  } {
    // 1. Validation
    const cleanMobile = input.mobileNumber.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      return { success: false, error: 'A valid 10-digit Indian mobile number is required.' };
    }
    if (!input.fullName.trim()) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!input.dateOfBirth) {
      return { success: false, error: 'Date of birth is required.' };
    }

    const cleanAadhaar = (input.aadhaarNumber || '').replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      return { success: false, error: 'A valid 12-digit Aadhaar number is required for verification.' };
    }

    // 2. Generate Unique Healthcare ID
    const healthcareId = this.generateHealthcareId();
    const age = this.calculateAge(input.dateOfBirth);
    const maskedAadhaar = this.maskAadhaar(cleanAadhaar);

    // 3. Build Stored Record - STRICTLY NO FULL AADHAAR
    const newRecord: StoredPatientRecord = {
      healthcareId,
      fullName: input.fullName.trim(),
      dateOfBirth: input.dateOfBirth,
      age,
      gender: input.gender,
      address: input.address.trim(),
      email: input.email?.trim() || undefined,
      mobileNumber: cleanMobile,
      bloodGroup: input.bloodGroup || 'O+',
      maskedAadhaar, // ONLY MASKED
      abhaId: input.abhaId?.trim() || undefined,
      emergencyContact: {
        fullName: input.emergencyContact.fullName.trim(),
        relationship: input.emergencyContact.relationship,
        mobileNumber: input.emergencyContact.mobileNumber.replace(/\D/g, '').slice(-10),
        email: input.emergencyContact.email?.trim() || undefined,
        address: input.emergencyContact.address?.trim() || undefined,
      },
      mobileVerified: true,
      registrationStatus: 'ACTIVE',
      createdAt: new Date().toISOString(),
      profilePhoto: undefined,
    };

    // 4. Save to localStorage
    const current = this.getAllPatients();
    const updated = [newRecord, ...current];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist registered patient', e);
    }

    return {
      success: true,
      patient: newRecord,
    };
  }

  /**
   * Find patient for login by:
   * 1. Healthcare ID (e.g. "HP-100245")
   * 2. Mobile Number (e.g. "9876543210")
   * 3. ABHA ID (e.g. "rahul@abdm")
   *
   * Note: Aadhaar is EXPLICITLY NOT supported as a login method.
   */
  findPatientForLogin(
    method: 'HEALTHCARE_ID' | 'MOBILE' | 'ABHA_ID',
    identifier: string
  ): {
    success: boolean;
    patient?: StoredPatientRecord;
    error?: string;
  } {
    const cleanId = (identifier || '').trim();
    if (!cleanId) {
      return { success: false, error: 'Please enter your login identifier.' };
    }

    const all = this.getAllPatients();

    if (method === 'HEALTHCARE_ID') {
      const match = all.find(
        (p) => p.healthcareId.toLowerCase() === cleanId.toLowerCase()
      );
      if (match) {
        return { success: true, patient: match };
      }
      return {
        success: false,
        error: `No patient account found with Healthcare ID "${cleanId}". Please check your ID or sign up.`,
      };
    }

    if (method === 'MOBILE') {
      const digits = cleanId.replace(/\D/g, '').slice(-10);
      if (digits.length !== 10) {
        return {
          success: false,
          error: 'Please enter a valid 10-digit Indian mobile number.',
        };
      }
      const match = all.find((p) => p.mobileNumber === digits);
      if (match) {
        return { success: true, patient: match };
      }
      return {
        success: false,
        error: `No registered patient account found with mobile number +91 ${digits}. Please sign up first.`,
      };
    }

    if (method === 'ABHA_ID') {
      const match = all.find(
        (p) => p.abhaId && p.abhaId.toLowerCase() === cleanId.toLowerCase()
      );
      if (match) {
        return { success: true, patient: match };
      }
      return {
        success: false,
        error: `No registered patient account found with ABHA ID "${cleanId}". Please verify your ABHA ID or use your Healthcare ID / Mobile Number.`,
      };
    }

    return { success: false, error: 'Unsupported login method.' };
  }

  /**
   * Mask mobile for OTP display (e.g. "+91 98XXX X3210")
   */
  maskMobile(mobile: string): string {
    const clean = mobile.replace(/\D/g, '').slice(-10);
    if (clean.length < 10) return '+91 XXXXX XXXXX';
    return `+91 ${clean.slice(0, 2)}XXX X${clean.slice(6)}`;
  }

  /**
   * Verify mock OTP (accepts "123456" or any 6-digit numeric OTP for demo)
   */
  verifyOtp(otp: string): { isValid: boolean; error?: string } {
    const clean = otp.replace(/\D/g, '');
    if (clean.length !== 6) {
      return { isValid: false, error: 'Please enter a valid 6-digit OTP code.' };
    }
    return { isValid: true };
  }
}

export const patientAuthService = new PatientAuthService();
