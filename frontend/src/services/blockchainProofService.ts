/**
 * Frontend Blockchain Proof Service
 *
 * Checks whether a medical record is genuine and whether its changes were authorized.
 * Demonstrates the three core verification states:
 * 1. AUTHORIZED_CHANGE (🟢 Authorized Change)
 * 2. UNAUTHORIZED_MODIFICATION (🔴 Unauthorized Modification)
 * 3. AUTHORIZED_BUT_CHANGED (🟡 Authorized but Changed)
 *
 * Keeps technical blockchain data (hashes, blocks, transactions) internal/mocked,
 * exposing ONLY clean, human-friendly verification data to the UI.
 */

export type VerificationState = 'AUTHORIZED_CHANGE' | 'UNAUTHORIZED_MODIFICATION' | 'AUTHORIZED_BUT_CHANGED';

export interface PatientProofCard {
  id: string;
  name: string;
  healthId: string;
  photoUrl: string;
  isVerified: boolean;
  prescriptionRecordsCount: number;
  lastUpdated: string;
  availableRecords: {
    id: string;
    title: string;
    category: string;
    state: VerificationState;
  }[];
}

export interface DoctorProofCard {
  id: string;
  name: string;
  doctorId: string;
  photoUrl: string;
  isVerified: boolean;
  hospital: string;
  recordsUpdatedCount: number;
  changedRecords: {
    recordId: string;
    patientName: string;
    healthId: string;
    category: string;
    state: VerificationState;
    stateLabel: string;
  }[];
}

export interface RecordVerificationResult {
  recordId: string;
  recordTitle: string;
  state: VerificationState;
  stateTitle: string;
  stateDescription: string;
  patient: {
    name: string;
    healthId: string;
    photoUrl: string;
  };
  changedBy: {
    name: string;
    doctorId?: string;
    hospital?: string;
    photoUrl?: string;
  };
  whatChanged: string;
  previousValue?: string;
  updatedValue?: string;
  reason: string;
  changedOn: string;
  permission: string;
  audit: string;
  recordIntegrity: string;
  systemActions?: string[];
  detailedNotes: string;
}

export interface RecordHistoryItem {
  id: string;
  stage: 'ORIGINAL_RECORD' | 'AUTHORIZED_CHANGE' | 'UNAUTHORIZED_MODIFICATION' | 'AUTHORIZED_BUT_CHANGED';
  title: string;
  doctor: string;
  doctorId: string;
  timestamp: string;
  whatChanged: string;
  reason: string;
  authorizationStatus: string;
  verificationStatus: string;
}

// ---------------------------------------------------------------------------
// MOCK DATA STORE
// ---------------------------------------------------------------------------

const MOCK_PATIENT_PROOFS: PatientProofCard[] = [
  {
    id: 'p-1',
    name: 'Rahul Sharma',
    healthId: 'HP-100245',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    isVerified: true,
    prescriptionRecordsCount: 3,
    lastUpdated: '14 Sep 2026',
    availableRecords: [
      {
        id: 'REC-HYPERTENSION-01',
        title: 'Prescription: Hypertension Management',
        category: 'Prescription',
        state: 'AUTHORIZED_CHANGE',
      },
      {
        id: 'REC-CONTROLLED-MED-02',
        title: 'Prescription: Pain Management Schedule',
        category: 'Prescription',
        state: 'UNAUTHORIZED_MODIFICATION',
      },
      {
        id: 'REC-CLINICAL-NOTES-03',
        title: 'Clinical Care Plan & Consultation',
        category: 'Medical History',
        state: 'AUTHORIZED_BUT_CHANGED',
      },
    ],
  },
  {
    id: 'p-2',
    name: 'Suresh Kumar',
    healthId: 'HP-100450',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    isVerified: true,
    prescriptionRecordsCount: 2,
    lastUpdated: '14 Sep 2026',
    availableRecords: [
      {
        id: 'REC-SURESH-01',
        title: 'Medical History: Cardiology Review',
        category: 'Medical History',
        state: 'AUTHORIZED_BUT_CHANGED',
      },
      {
        id: 'REC-SURESH-02',
        title: 'Prescription: Statin Therapy',
        category: 'Prescription',
        state: 'AUTHORIZED_CHANGE',
      },
    ],
  },
  {
    id: 'p-3',
    name: 'Ahmed Khan',
    healthId: 'HP-100512',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    isVerified: true,
    prescriptionRecordsCount: 4,
    lastUpdated: '13 Sep 2026',
    availableRecords: [
      {
        id: 'REC-AHMED-01',
        title: 'Vitals & Routine Blood Pressure Log',
        category: 'Vitals',
        state: 'AUTHORIZED_CHANGE',
      },
    ],
  },
  {
    id: 'p-4',
    name: 'Priya Patel',
    healthId: 'HP-100318',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    isVerified: true,
    prescriptionRecordsCount: 2,
    lastUpdated: '12 Sep 2026',
    availableRecords: [
      {
        id: 'REC-PRIYA-01',
        title: 'Diagnostic Lab Reports: Full Blood Count',
        category: 'Lab Reports',
        state: 'AUTHORIZED_CHANGE',
      },
    ],
  },
];

const MOCK_DOCTOR_PROOFS: DoctorProofCard[] = [
  {
    id: 'doc-1',
    name: 'Dr. Ananya Sharma',
    doctorId: 'DOC-20481',
    photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    isVerified: true,
    hospital: 'Apex Health City',
    recordsUpdatedCount: 5,
    changedRecords: [
      {
        recordId: 'REC-HYPERTENSION-01',
        patientName: 'Rahul Sharma',
        healthId: 'HP-100245',
        category: 'Prescription',
        state: 'AUTHORIZED_CHANGE',
        stateLabel: '✓ Authorized Change',
      },
      {
        recordId: 'REC-SURESH-01',
        patientName: 'Suresh Kumar',
        healthId: 'HP-100450',
        category: 'Medical History',
        state: 'AUTHORIZED_BUT_CHANGED',
        stateLabel: '🟡 Authorized but Changed',
      },
      {
        recordId: 'REC-AHMED-01',
        patientName: 'Ahmed Khan',
        healthId: 'HP-100512',
        category: 'Vitals',
        state: 'AUTHORIZED_CHANGE',
        stateLabel: '✓ Authorized Change',
      },
      {
        recordId: 'REC-PRIYA-01',
        patientName: 'Priya Patel',
        healthId: 'HP-100318',
        category: 'Lab Reports',
        state: 'AUTHORIZED_CHANGE',
        stateLabel: '✓ Authorized Change',
      },
    ],
  },
  {
    id: 'doc-2',
    name: 'Dr. Rajesh Verma',
    doctorId: 'DOC-20482',
    photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    isVerified: true,
    hospital: 'Apex Neuro Center',
    recordsUpdatedCount: 3,
    changedRecords: [
      {
        recordId: 'REC-HYPERTENSION-01',
        patientName: 'Rahul Sharma',
        healthId: 'HP-100245',
        category: 'Medical History Note',
        state: 'AUTHORIZED_CHANGE',
        stateLabel: '✓ Authorized Change',
      },
    ],
  },
  {
    id: 'doc-3',
    name: 'Dr. Vikram Rao',
    doctorId: 'DOC-20911',
    photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    isVerified: true,
    hospital: 'City Care Hospital',
    recordsUpdatedCount: 1,
    changedRecords: [
      {
        recordId: 'REC-SURESH-02',
        patientName: 'Suresh Kumar',
        healthId: 'HP-100450',
        category: 'Prescription',
        state: 'AUTHORIZED_CHANGE',
        stateLabel: '✓ Authorized Change',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// VERIFICATION RESULTS STORE
// ---------------------------------------------------------------------------

const VERIFICATION_RESULTS: Record<string, RecordVerificationResult> = {
  // 1. AUTHORIZED CHANGE (Section 4)
  'REC-HYPERTENSION-01': {
    recordId: 'REC-HYPERTENSION-01',
    recordTitle: 'Prescription — Hypertension Management',
    state: 'AUTHORIZED_CHANGE',
    stateTitle: 'Authorized Change',
    stateDescription: 'This record was changed by an authorized doctor.',
    patient: {
      name: 'Rahul Sharma',
      healthId: 'HP-100245',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    },
    changedBy: {
      name: 'Dr. Ananya Sharma',
      doctorId: 'DOC-20481',
      hospital: 'Apex Health City',
      photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    },
    whatChanged: 'Medicine dosage updated',
    previousValue: 'Telmisartan 40mg',
    updatedValue: 'Telmisartan 80mg',
    reason: "Dosage adjusted based on patient's condition.",
    changedOn: '14 Sep 2026 • 10:30 AM',
    permission: '✓ Authorized',
    audit: '✓ Change recorded',
    recordIntegrity: '✓ Verified',
    systemActions: ['Verified digital signature of attending physician', 'Updated immutable ledger audit trial'],
    detailedNotes:
      'The attending doctor Dr. Ananya Sharma holds verified clinical privileges and active patient consent. The medicine dosage modification from 40mg to 80mg was properly recorded and authorized in the system.',
  },

  // 2. UNAUTHORIZED MODIFICATION (Section 5)
  'REC-CONTROLLED-MED-02': {
    recordId: 'REC-CONTROLLED-MED-02',
    recordTitle: 'Prescription — Pain Management Schedule',
    state: 'UNAUTHORIZED_MODIFICATION',
    stateTitle: 'Unauthorized Modification',
    stateDescription: 'This record was changed without valid permission.',
    patient: {
      name: 'Rahul Sharma',
      healthId: 'HP-100245',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    },
    changedBy: {
      name: 'Unknown / Dr. X',
      doctorId: 'UNVERIFIED',
      hospital: 'External Network',
    },
    whatChanged: 'Prescription information',
    previousValue: 'Acetaminophen 500mg (oral as needed)',
    updatedValue: 'Oxycodone 20mg (unauthorized addition)',
    reason: 'No clinical consultation reason or consent token attached to this modification request.',
    changedOn: '14 Sep 2026 • 11:45 AM',
    permission: '✕ No valid permission found',
    audit: '✓ Security event recorded',
    recordIntegrity: '⚠ Verification Failed',
    systemActions: ['Change flagged', 'Security event recorded', 'Patient access protected'],
    detailedNotes:
      'This record was changed without valid doctor credentials or patient authorization. The unauthorized modification was automatically isolated and blocked, and a security alert was recorded.',
  },

  // 3. AUTHORIZED BUT CHANGED (Section 6)
  'REC-CLINICAL-NOTES-03': {
    recordId: 'REC-CLINICAL-NOTES-03',
    recordTitle: 'Clinical Care Plan & Consultation',
    state: 'AUTHORIZED_BUT_CHANGED',
    stateTitle: 'Authorized but Changed',
    stateDescription:
      'This record was changed by an authorized doctor, but the required verification record is incomplete.',
    patient: {
      name: 'Rahul Sharma',
      healthId: 'HP-100245',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    },
    changedBy: {
      name: 'Dr. Ananya Sharma',
      doctorId: 'DOC-20481',
      hospital: 'Apex Health City',
      photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    },
    whatChanged: 'Medical record information',
    previousValue: 'Observation note: Patient reports mild dizziness upon standing.',
    updatedValue: 'Observation note: Patient reports mild dizziness; suggested hydration increase and posture care.',
    reason: 'Follow-up clinical clarification entered during ward rounds.',
    changedOn: '14 Sep 2026 • 12:15 PM',
    permission: '✓ Authorized',
    audit: '⚠ Review Required',
    recordIntegrity: '⚠ Incomplete',
    systemActions: ['Audit entry marked for secondary administrative verification', 'Doctor notified to finalize counter-signature'],
    detailedNotes:
      'Dr. Ananya Sharma had full clinical authority to update this consultation note. However, the secondary hospital digital witness receipt was interrupted, meaning the verification record is incomplete. Clinical administrator review is required.',
  },

  // Additional doctor records
  'REC-SURESH-01': {
    recordId: 'REC-SURESH-01',
    recordTitle: 'Medical History: Cardiology Review',
    state: 'AUTHORIZED_BUT_CHANGED',
    stateTitle: 'Authorized but Changed',
    stateDescription:
      'This record was changed by an authorized doctor, but the required verification record is incomplete.',
    patient: {
      name: 'Suresh Kumar',
      healthId: 'HP-100450',
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
    },
    changedBy: {
      name: 'Dr. Ananya Sharma',
      doctorId: 'DOC-20481',
      hospital: 'Apex Health City',
      photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    },
    whatChanged: 'Cardiology Review note',
    previousValue: 'Echocardiogram: Pending review',
    updatedValue: 'Echocardiogram: Normal LV function, LVEF 60%',
    reason: 'Review of uploaded echo imaging results.',
    changedOn: '14 Sep 2026 • 09:15 AM',
    permission: '✓ Authorized',
    audit: '⚠ Review Required',
    recordIntegrity: '⚠ Incomplete',
    systemActions: ['Pending departmental supervisor counter-verification'],
    detailedNotes: 'Doctor has verified cardiology privileges. Awaiting department head acknowledgment.',
  },
};

// ---------------------------------------------------------------------------
// TIMELINE HISTORIES (Section 8)
// ---------------------------------------------------------------------------

const TIMELINE_HISTORIES: Record<string, RecordHistoryItem[]> = {
  'REC-HYPERTENSION-01': [
    {
      id: 'HIST-1',
      stage: 'ORIGINAL_RECORD',
      title: 'Original Record',
      doctor: 'Dr. Ananya Sharma',
      doctorId: 'DOC-20481',
      timestamp: '14 Sep 2026 • 10:00 AM',
      whatChanged: 'Initial prescription created (Telmisartan 40mg oral once daily)',
      reason: 'Initial diagnosis of essential hypertension stage 1',
      authorizationStatus: '✓ Authorized',
      verificationStatus: '✓ Verified',
    },
    {
      id: 'HIST-2',
      stage: 'AUTHORIZED_CHANGE',
      title: 'Authorized Change',
      doctor: 'Dr. Ananya Sharma',
      doctorId: 'DOC-20481',
      timestamp: '14 Sep 2026 • 10:30 AM',
      whatChanged: 'Medicine dosage updated (Telmisartan 40mg → 80mg)',
      reason: "Dosage adjusted based on patient's elevated morning BP reading (148/94)",
      authorizationStatus: '✓ Authorized',
      verificationStatus: '✓ Verified',
    },
    {
      id: 'HIST-3',
      stage: 'AUTHORIZED_CHANGE',
      title: 'Authorized Change',
      doctor: 'Dr. Rajesh Verma',
      doctorId: 'DOC-20482',
      timestamp: '14 Sep 2026 • 11:20 AM',
      whatChanged: 'Clinical note updated',
      reason: 'Added neurology follow-up clearance note for headache symptoms',
      authorizationStatus: '✓ Authorized',
      verificationStatus: '✓ Verified',
    },
  ],

  'REC-CONTROLLED-MED-02': [
    {
      id: 'HIST-1',
      stage: 'ORIGINAL_RECORD',
      title: 'Original Record',
      doctor: 'Dr. Ananya Sharma',
      doctorId: 'DOC-20481',
      timestamp: '13 Sep 2026 • 04:00 PM',
      whatChanged: 'Initial post-op pain management: Acetaminophen 500mg',
      reason: 'Standard routine analgesic protocol',
      authorizationStatus: '✓ Authorized',
      verificationStatus: '✓ Verified',
    },
    {
      id: 'HIST-2',
      stage: 'UNAUTHORIZED_MODIFICATION',
      title: 'Unauthorized Modification',
      doctor: 'Unknown / Dr. X',
      doctorId: 'UNVERIFIED',
      timestamp: '14 Sep 2026 • 11:45 AM',
      whatChanged: 'Prescription changed to Oxycodone 20mg without consent',
      reason: 'No valid clinical reason or patient consent provided',
      authorizationStatus: '✕ No valid permission found',
      verificationStatus: '⚠ Verification Failed',
    },
  ],

  'REC-CLINICAL-NOTES-03': [
    {
      id: 'HIST-1',
      stage: 'ORIGINAL_RECORD',
      title: 'Original Record',
      doctor: 'Dr. Ananya Sharma',
      doctorId: 'DOC-20481',
      timestamp: '14 Sep 2026 • 11:00 AM',
      whatChanged: 'Initial observation note logged during admission triage',
      reason: 'Standard admission intake',
      authorizationStatus: '✓ Authorized',
      verificationStatus: '✓ Verified',
    },
    {
      id: 'HIST-2',
      stage: 'AUTHORIZED_BUT_CHANGED',
      title: 'Authorized but Changed',
      doctor: 'Dr. Ananya Sharma',
      doctorId: 'DOC-20481',
      timestamp: '14 Sep 2026 • 12:15 PM',
      whatChanged: 'Medical record information amended with hydration guidance',
      reason: 'Follow-up clinical clarification entered during ward rounds',
      authorizationStatus: '✓ Authorized',
      verificationStatus: '⚠ Incomplete',
    },
  ],
};

// ---------------------------------------------------------------------------
// SERVICE CLASS
// ---------------------------------------------------------------------------

class BlockchainProofService {
  /**
   * Search for patients by name or healthId
   */
  async searchPatients(query: string): Promise<PatientProofCard[]> {
    await new Promise((r) => setTimeout(r, 200));
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_PATIENT_PROOFS;

    return MOCK_PATIENT_PROOFS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.healthId.toLowerCase().includes(q)
    );
  }

  /**
   * Search for doctors by doctorId or name
   */
  async searchDoctors(query: string): Promise<DoctorProofCard[]> {
    await new Promise((r) => setTimeout(r, 200));
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_DOCTOR_PROOFS;

    return MOCK_DOCTOR_PROOFS.filter(
      (d) => d.doctorId.toLowerCase().includes(q) || d.name.toLowerCase().includes(q)
    );
  }

  /**
   * Check a specific patient's record
   */
  async checkPatientRecord(recordId: string): Promise<RecordVerificationResult> {
    // Artificial small delay for "Checking record history..." state
    await new Promise((r) => setTimeout(r, 650));

    if (VERIFICATION_RESULTS[recordId]) {
      return VERIFICATION_RESULTS[recordId];
    }

    // Default fallback to first result
    return VERIFICATION_RESULTS['REC-HYPERTENSION-01'];
  }

  /**
   * Get timeline history of a record
   */
  async getRecordHistory(recordId: string): Promise<RecordHistoryItem[]> {
    await new Promise((r) => setTimeout(r, 150));
    if (TIMELINE_HISTORIES[recordId]) {
      return TIMELINE_HISTORIES[recordId];
    }
    return TIMELINE_HISTORIES['REC-HYPERTENSION-01'];
  }

  /**
   * Convenience lookup by patient Health ID
   */
  getPatientByHealthId(healthId: string): PatientProofCard | undefined {
    return MOCK_PATIENT_PROOFS.find(
      (p) => p.healthId.toLowerCase() === healthId.trim().toLowerCase()
    );
  }

  /**
   * Convenience lookup by Doctor ID
   */
  getDoctorByDoctorId(doctorId: string): DoctorProofCard | undefined {
    return MOCK_DOCTOR_PROOFS.find(
      (d) => d.doctorId.toLowerCase() === doctorId.trim().toLowerCase()
    );
  }
}

export const blockchainProofService = new BlockchainProofService();
