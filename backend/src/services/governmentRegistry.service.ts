/**
 * Mock Government Medical Registry Verification Service.
 * Prototype verification system comparing submitted doctor credentials against
 * state and national medical council registries.
 *
 * NOTE: This is a simulation for testing accreditation pipelines and is NOT a live government API.
 */

export interface GovDoctorRecord {
  doctorIdNumber?: string;
  fullName: string;
  dob: string; // YYYY-MM-DD
  registrationNumber: string;
  authority: string;
  authorityType: string; // 'State Medical Council' | 'Central Authority'
  registrationState: string;
  qualification: string;
  specialization: string;
  yearOfRegistration?: number;
  status: 'ACTIVE_REGISTERED' | 'SUSPENDED' | 'REVOKED';
}

export interface VerificationFieldResult {
  field: string;
  submitted: string;
  government: string;
  matched: boolean;
}

export interface VerificationResult {
  status: 'GOVERNMENT_MATCHED' | 'GOVERNMENT_MISMATCH';
  isMatched: boolean;
  matchScorePercent: number;
  comparisonDetails: VerificationFieldResult[];
  mismatchSummary: string[];
  governmentRecord?: GovDoctorRecord | null;
  verifiedAt: string;
}

// Pre-seeded mock government registry records for testing and evaluation
export const MOCK_GOVERNMENT_REGISTRY: GovDoctorRecord[] = [
  {
    doctorIdNumber: 'NMC-DOC-10021',
    fullName: 'Dr. Rajesh Verma',
    dob: '1982-05-14',
    registrationNumber: 'TSMC-458721',
    authority: 'Telangana State Medical Council',
    authorityType: 'State Medical Council',
    registrationState: 'Telangana',
    qualification: 'MBBS, MD',
    specialization: 'Neurology',
    yearOfRegistration: 2008,
    status: 'ACTIVE_REGISTERED',
  },
  {
    doctorIdNumber: 'NMC-DOC-10022',
    fullName: 'Dr. Ananya Sharma',
    dob: '1988-09-22',
    registrationNumber: 'TS-MCI-2024-8921',
    authority: 'Telangana State Medical Council',
    authorityType: 'State Medical Council',
    registrationState: 'Telangana',
    qualification: 'MBBS, MS',
    specialization: 'Cardiology',
    yearOfRegistration: 2014,
    status: 'ACTIVE_REGISTERED',
  },
  {
    doctorIdNumber: 'NMC-DOC-10023',
    fullName: 'Dr. Vikram Malhotra',
    dob: '1979-11-03',
    registrationNumber: 'MMC-784912',
    authority: 'Maharashtra Medical Council',
    authorityType: 'State Medical Council',
    registrationState: 'Maharashtra',
    qualification: 'MBBS, MS, MCh',
    specialization: 'Orthopedics',
    yearOfRegistration: 2005,
    status: 'ACTIVE_REGISTERED',
  },
  {
    doctorIdNumber: 'NMC-DOC-10024',
    fullName: 'Dr. Priya Nair',
    dob: '1990-03-17',
    registrationNumber: 'KMC-652391',
    authority: 'Karnataka Medical Council',
    authorityType: 'State Medical Council',
    registrationState: 'Karnataka',
    qualification: 'MBBS, MD',
    specialization: 'Dermatology',
    yearOfRegistration: 2016,
    status: 'ACTIVE_REGISTERED',
  },
  {
    doctorIdNumber: 'NMC-DOC-10025',
    fullName: 'Dr. Suresh Kumar',
    dob: '1985-08-29',
    registrationNumber: 'NMC-NAT-990142',
    authority: 'National Medical Commission',
    authorityType: 'Central Authority',
    registrationState: 'Delhi',
    qualification: 'MBBS, DM',
    specialization: 'Endocrinology',
    yearOfRegistration: 2011,
    status: 'ACTIVE_REGISTERED',
  },
];

export class GovernmentRegistryService {
  /**
   * Compare submitted doctor application against the mock registry field-by-field.
   */
  async verifyDoctorApplication(submitted: {
    doctorIdNumber?: string;
    fullName: string;
    dob?: string;
    registrationNumber: string;
    authority?: string;
    authorityType?: string;
    registrationState?: string;
    qualification?: string;
    specialization?: string;
  }): Promise<VerificationResult> {
    const cleanRegNum = (submitted.registrationNumber || '').trim().toUpperCase();
    const cleanDocId = (submitted.doctorIdNumber || '').trim().toUpperCase();

    // Find in mock registry by registration number or doctor ID
    const govRecord = MOCK_GOVERNMENT_REGISTRY.find(
      (r) =>
        r.registrationNumber.toUpperCase() === cleanRegNum ||
        (cleanDocId && r.doctorIdNumber?.toUpperCase() === cleanDocId)
    );

    const comparisons: VerificationFieldResult[] = [];
    const mismatches: string[] = [];

    const norm = (s?: string) => (s ? s.trim().toLowerCase().replace(/[^a-z0-9]/g, '') : '');

    if (!govRecord) {
      // If not present in explicit mock registry, check if registration number matches test pattern or create synthetic comparison
      // If registration number starts with 'MISMATCH-' or contains 'MISMATCH', intentionally flag as mismatch
      const isMismatchTest = cleanRegNum.includes('MISMATCH') || cleanRegNum.startsWith('FAKE') || cleanRegNum.startsWith('INV');

      if (isMismatchTest) {
        comparisons.push(
          {
            field: 'Registration Number',
            submitted: submitted.registrationNumber || 'None',
            government: 'NOT_FOUND_IN_REGISTRY',
            matched: false,
          },
          {
            field: 'Full Name',
            submitted: submitted.fullName || 'None',
            government: 'UNREGISTERED_PRACTITIONER',
            matched: false,
          },
          {
            field: 'Registration Authority',
            submitted: submitted.authority || 'None',
            government: 'NO_RECORD',
            matched: false,
          }
        );
        mismatches.push(
          `Registration Number: Submitted ${submitted.registrationNumber} - Not found in Government Registry`,
          `Full Name: Submitted "${submitted.fullName}" does not match any accredited medical council entry.`
        );

        return {
          status: 'GOVERNMENT_MISMATCH',
          isMatched: false,
          matchScorePercent: 0,
          comparisonDetails: comparisons,
          mismatchSummary: mismatches,
          governmentRecord: null,
          verifiedAt: new Date().toISOString(),
        };
      }

      // If a standard valid pattern is provided for an auto-test doctor (e.g. DOC-..., TS-..., MCI-...),
      // generate a baseline verification result matching the council format
      const mockGovDocId = submitted.doctorIdNumber || `NMC-${cleanRegNum.slice(0, 8)}`;
      const mockRecord: GovDoctorRecord = {
        doctorIdNumber: mockGovDocId,
        fullName: submitted.fullName,
        dob: submitted.dob || '1985-01-01',
        registrationNumber: submitted.registrationNumber,
        authority: submitted.authority || 'State Medical Council',
        authorityType: submitted.authorityType || 'State Medical Council',
        registrationState: submitted.registrationState || 'Telangana',
        qualification: submitted.qualification || 'MBBS',
        specialization: submitted.specialization || 'General Medicine',
        status: 'ACTIVE_REGISTERED',
      };

      comparisons.push(
        { field: 'Doctor ID', submitted: submitted.doctorIdNumber || mockGovDocId, government: mockGovDocId, matched: true },
        { field: 'Full Name', submitted: submitted.fullName, government: mockRecord.fullName, matched: true },
        { field: 'Date of Birth', submitted: submitted.dob || 'N/A', government: mockRecord.dob, matched: true },
        { field: 'Registration Number', submitted: submitted.registrationNumber, government: mockRecord.registrationNumber, matched: true },
        { field: 'Registration Authority', submitted: submitted.authority || 'State Medical Council', government: mockRecord.authority, matched: true },
        { field: 'Registration State', submitted: submitted.registrationState || 'Telangana', government: mockRecord.registrationState, matched: true },
        { field: 'Qualification', submitted: submitted.qualification || 'MBBS', government: mockRecord.qualification, matched: true },
        { field: 'Specialization', submitted: submitted.specialization || 'General Medicine', government: mockRecord.specialization, matched: true }
      );

      return {
        status: 'GOVERNMENT_MATCHED',
        isMatched: true,
        matchScorePercent: 100,
        comparisonDetails: comparisons,
        mismatchSummary: [],
        governmentRecord: mockRecord,
        verifiedAt: new Date().toISOString(),
      };
    }

    // Compare with existing mock government record field-by-field
    // 1. Doctor ID
    if (submitted.doctorIdNumber && govRecord.doctorIdNumber) {
      const match = norm(submitted.doctorIdNumber) === norm(govRecord.doctorIdNumber);
      comparisons.push({
        field: 'Doctor ID',
        submitted: submitted.doctorIdNumber,
        government: govRecord.doctorIdNumber,
        matched: match,
      });
      if (!match) mismatches.push(`Doctor ID: Submitted ${submitted.doctorIdNumber} vs Government ${govRecord.doctorIdNumber}`);
    }

    // 2. Full Name (Fuzzy / Normalized check)
    const nameMatch = norm(submitted.fullName).includes(norm(govRecord.fullName)) || norm(govRecord.fullName).includes(norm(submitted.fullName));
    comparisons.push({
      field: 'Full Name',
      submitted: submitted.fullName,
      government: govRecord.fullName,
      matched: nameMatch,
    });
    if (!nameMatch) mismatches.push(`Full Name: Submitted "${submitted.fullName}" vs Government "${govRecord.fullName}"`);

    // 3. Date of Birth
    if (submitted.dob) {
      const dobMatch = submitted.dob === govRecord.dob;
      comparisons.push({
        field: 'Date of Birth',
        submitted: submitted.dob,
        government: govRecord.dob,
        matched: dobMatch,
      });
      if (!dobMatch) mismatches.push(`DOB: Submitted ${submitted.dob} vs Government ${govRecord.dob}`);
    }

    // 4. Medical Registration Number
    const regMatch = norm(submitted.registrationNumber) === norm(govRecord.registrationNumber);
    comparisons.push({
      field: 'Registration Number',
      submitted: submitted.registrationNumber,
      government: govRecord.registrationNumber,
      matched: regMatch,
    });
    if (!regMatch) mismatches.push(`Registration Number: Submitted ${submitted.registrationNumber} vs Government ${govRecord.registrationNumber}`);

    // 5. Authority
    if (submitted.authority) {
      const authMatch = norm(submitted.authority).includes(norm(govRecord.authority)) || norm(govRecord.authority).includes(norm(submitted.authority));
      comparisons.push({
        field: 'Registration Authority',
        submitted: submitted.authority,
        government: govRecord.authority,
        matched: authMatch,
      });
      if (!authMatch) mismatches.push(`Authority: Submitted "${submitted.authority}" vs Government "${govRecord.authority}"`);
    }

    // 6. Registration State
    if (submitted.registrationState) {
      const stateMatch = norm(submitted.registrationState) === norm(govRecord.registrationState);
      comparisons.push({
        field: 'Registration State',
        submitted: submitted.registrationState,
        government: govRecord.registrationState,
        matched: stateMatch,
      });
      if (!stateMatch) mismatches.push(`State: Submitted "${submitted.registrationState}" vs Government "${govRecord.registrationState}"`);
    }

    // 7. Qualification
    if (submitted.qualification) {
      const qualMatch = norm(submitted.qualification).includes(norm(govRecord.qualification)) || norm(govRecord.qualification).includes(norm(submitted.qualification));
      comparisons.push({
        field: 'Qualification',
        submitted: submitted.qualification,
        government: govRecord.qualification,
        matched: qualMatch,
      });
      if (!qualMatch) mismatches.push(`Qualification: Submitted "${submitted.qualification}" vs Government "${govRecord.qualification}"`);
    }

    // 8. Specialization
    if (submitted.specialization) {
      const specMatch = norm(submitted.specialization).includes(norm(govRecord.specialization)) || norm(govRecord.specialization).includes(norm(submitted.specialization));
      comparisons.push({
        field: 'Specialization',
        submitted: submitted.specialization,
        government: govRecord.specialization,
        matched: specMatch,
      });
      if (!specMatch) mismatches.push(`Specialization: Submitted "${submitted.specialization}" vs Government "${govRecord.specialization}"`);
    }

    const totalFields = comparisons.length;
    const matchedFields = comparisons.filter((c) => c.matched).length;
    const matchScorePercent = totalFields > 0 ? Math.round((matchedFields / totalFields) * 100) : 100;
    const isMatched = mismatches.length === 0;

    return {
      status: isMatched ? 'GOVERNMENT_MATCHED' : 'GOVERNMENT_MISMATCH',
      isMatched,
      matchScorePercent,
      comparisonDetails: comparisons,
      mismatchSummary: mismatches,
      governmentRecord: govRecord,
      verifiedAt: new Date().toISOString(),
    };
  }
}

export const governmentRegistryService = new GovernmentRegistryService();
