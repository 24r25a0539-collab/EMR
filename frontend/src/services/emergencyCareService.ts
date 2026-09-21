/**
 * Frontend Emergency Care Service (Admin -> Emergency Care)
 *
 * Provides decoupled mock emergency sessions, filtering, search, and detail lookup.
 * Designed to connect to real backend APIs in the future.
 */

export type EmergencyStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED';

export interface EmergencyTimelineEvent {
  id: string;
  title: string;
  time: string;
  isCompleted: boolean;
}

export interface EmergencySessionItem {
  id: string;
  status: EmergencyStatus;
  statusBadgeText: string; // e.g. "🟢 ACTIVE", "✓ COMPLETED", "○ EXPIRED"
  cardHeader: string; // e.g. "🚨 Active Emergency", "✓ Emergency Completed", "○ Emergency Expired"

  // Doctor Details
  doctor: {
    name: string;
    photoUrl: string;
    doctorId: string;
    hospital: string;
    qualification: string;
    experience: string;
    isVerified: boolean;
  };

  // Patient Details
  patient: {
    name: string;
    photoUrl: string;
    healthId: string;
    isVerified: boolean;
  };

  // Emergency Details
  emergencyReason: string;
  patientCondition: string;
  incident: string;
  startedAt: string;
  startedAtShort: string;
  endedAt?: string;
  accessType: string;

  // Nominee Notification
  nominee: {
    name: string;
    relationship: string;
    notificationSent: boolean;
    notificationSentAt: string;
  };

  // Audit
  audit: {
    isRecorded: boolean;
    auditTime: string;
    status: string;
  };

  // Timeline
  timeline: EmergencyTimelineEvent[];
}

export const MOCK_EMERGENCY_SESSIONS: EmergencySessionItem[] = [
  {
    id: 'EMS-2026-001',
    status: 'ACTIVE',
    statusBadgeText: '🟢 ACTIVE',
    cardHeader: '🚨 Active Emergency',
    doctor: {
      name: 'Dr. Ananya Sharma',
      photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      doctorId: 'DOC-20481',
      hospital: 'Apex Health City',
      qualification: 'MBBS, MD',
      experience: '8 Years',
      isVerified: true,
    },
    patient: {
      name: 'Rahul Sharma',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
      healthId: 'HP-100245',
      isVerified: true,
    },
    emergencyReason: 'Immediate medical evaluation required.',
    patientCondition: 'Patient is unconscious after an accident.',
    incident: 'Emergency treatment initiated at hospital.',
    startedAt: '14 Sep 2026 • 7:30 PM',
    startedAtShort: '14 Sep • 7:30 PM',
    endedAt: '14 Sep 2026 • 9:30 PM',
    accessType: 'Emergency Access',
    nominee: {
      name: 'Priya Sharma',
      relationship: 'Spouse',
      notificationSent: true,
      notificationSentAt: '14 Sep 2026 • 7:31 PM',
    },
    audit: {
      isRecorded: true,
      auditTime: '14 Sep 2026 • 7:30 PM',
      status: '✓ Recorded',
    },
    timeline: [
      { id: 't1', title: 'Doctor verified', time: '7:29 PM', isCompleted: true },
      { id: 't2', title: 'Emergency access started', time: '7:30 PM', isCompleted: true },
      { id: 't3', title: 'Nominee notified', time: '7:31 PM', isCompleted: true },
      { id: 't4', title: 'Audit recorded', time: '7:31 PM', isCompleted: true },
      { id: 't5', title: 'Access expires', time: '9:30 PM', isCompleted: false },
    ],
  },
  {
    id: 'EMS-2026-002',
    status: 'ACTIVE',
    statusBadgeText: '🟢 ACTIVE',
    cardHeader: '🚨 Active Emergency',
    doctor: {
      name: 'Dr. Vikram Rao',
      photoUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
      doctorId: 'DOC-20911',
      hospital: 'City Care Hospital',
      qualification: 'MBBS, DNB - Cardiology',
      experience: '12 Years',
      isVerified: true,
    },
    patient: {
      name: 'Ahmed Khan',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
      healthId: 'HP-100512',
      isVerified: true,
    },
    emergencyReason: 'Acute cardiac arrhythmia and sudden collapse.',
    patientCondition: 'Patient experiencing severe tachycardia and altered sensorium.',
    incident: 'Ambulance triage handover to intensive coronary care unit.',
    startedAt: '14 Sep 2026 • 8:15 PM',
    startedAtShort: '14 Sep • 8:15 PM',
    endedAt: '14 Sep 2026 • 10:15 PM',
    accessType: 'Emergency Access',
    nominee: {
      name: 'Fatima Khan',
      relationship: 'Sister',
      notificationSent: true,
      notificationSentAt: '14 Sep 2026 • 8:16 PM',
    },
    audit: {
      isRecorded: true,
      auditTime: '14 Sep 2026 • 8:15 PM',
      status: '✓ Recorded',
    },
    timeline: [
      { id: 't1', title: 'Doctor verified', time: '8:14 PM', isCompleted: true },
      { id: 't2', title: 'Emergency access started', time: '8:15 PM', isCompleted: true },
      { id: 't3', title: 'Nominee notified', time: '8:16 PM', isCompleted: true },
      { id: 't4', title: 'Audit recorded', time: '8:16 PM', isCompleted: true },
      { id: 't5', title: 'Access expires', time: '10:15 PM', isCompleted: false },
    ],
  },
  {
    id: 'EMS-2026-003',
    status: 'COMPLETED',
    statusBadgeText: '✓ COMPLETED',
    cardHeader: '✓ Emergency Completed',
    doctor: {
      name: 'Dr. Rajesh Verma',
      photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      doctorId: 'DOC-20981',
      hospital: 'Apex Health City',
      qualification: 'MBBS, MS, MCh',
      experience: '14 Years',
      isVerified: true,
    },
    patient: {
      name: 'Suresh Kumar',
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
      healthId: 'HP-100450',
      isVerified: true,
    },
    emergencyReason: 'Emergency treatment',
    patientCondition: 'Severe respiratory distress following acute asthma attack.',
    incident: 'Emergency bronchodilator treatment and oxygenation in Trauma Bay 2.',
    startedAt: '13 Sep 2026 • 4:20 PM',
    startedAtShort: '13 Sep • 4:20 PM',
    endedAt: '13 Sep 2026 • 6:05 PM',
    accessType: 'Emergency Access',
    nominee: {
      name: 'Sunita Kumar',
      relationship: 'Spouse',
      notificationSent: true,
      notificationSentAt: '13 Sep 2026 • 4:21 PM',
    },
    audit: {
      isRecorded: true,
      auditTime: '13 Sep 2026 • 4:20 PM',
      status: '✓ Recorded',
    },
    timeline: [
      { id: 't1', title: 'Doctor verified', time: '4:19 PM', isCompleted: true },
      { id: 't2', title: 'Emergency access started', time: '4:20 PM', isCompleted: true },
      { id: 't3', title: 'Nominee notified', time: '4:21 PM', isCompleted: true },
      { id: 't4', title: 'Audit recorded', time: '4:21 PM', isCompleted: true },
      { id: 't5', title: 'Session concluded & locked', time: '6:05 PM', isCompleted: true },
    ],
  },
  {
    id: 'EMS-2026-004',
    status: 'COMPLETED',
    statusBadgeText: '✓ COMPLETED',
    cardHeader: '✓ Emergency Completed',
    doctor: {
      name: 'Dr. Sneha Patil',
      photoUrl: 'https://images.unsplash.com/photo-1594824813589-20f781190226?auto=format&fit=crop&q=80&w=400',
      doctorId: 'DOC-20512',
      hospital: 'Metro General Hospital',
      qualification: 'MBBS, MS - Orthopaedics',
      experience: '9 Years',
      isVerified: true,
    },
    patient: {
      name: 'Priya Patel',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
      healthId: 'HP-100318',
      isVerified: true,
    },
    emergencyReason: 'Multiple orthopedic fractures and trauma immobilization.',
    patientCondition: 'Severe shock following vehicular collision on expressway.',
    incident: 'Emergency limb stabilization and radiology imaging completed.',
    startedAt: '13 Sep 2026 • 11:10 AM',
    startedAtShort: '13 Sep • 11:10 AM',
    endedAt: '13 Sep 2026 • 1:30 PM',
    accessType: 'Emergency Access',
    nominee: {
      name: 'Amit Patel',
      relationship: 'Brother',
      notificationSent: true,
      notificationSentAt: '13 Sep 2026 • 11:12 AM',
    },
    audit: {
      isRecorded: true,
      auditTime: '13 Sep 2026 • 11:10 AM',
      status: '✓ Recorded',
    },
    timeline: [
      { id: 't1', title: 'Doctor verified', time: '11:09 AM', isCompleted: true },
      { id: 't2', title: 'Emergency access started', time: '11:10 AM', isCompleted: true },
      { id: 't3', title: 'Nominee notified', time: '11:12 AM', isCompleted: true },
      { id: 't4', title: 'Audit recorded', time: '11:12 AM', isCompleted: true },
      { id: 't5', title: 'Session concluded & locked', time: '1:30 PM', isCompleted: true },
    ],
  },
  {
    id: 'EMS-2026-005',
    status: 'EXPIRED',
    statusBadgeText: '○ EXPIRED',
    cardHeader: '○ Emergency Expired',
    doctor: {
      name: 'Dr. Ananya Sharma',
      photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      doctorId: 'DOC-20481',
      hospital: 'Apex Health City',
      qualification: 'MBBS, MD',
      experience: '8 Years',
      isVerified: true,
    },
    patient: {
      name: 'Rahul Sharma',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
      healthId: 'HP-100245',
      isVerified: true,
    },
    emergencyReason: 'Emergency medical evaluation',
    patientCondition: 'Suspected acute ischemic stroke evaluation (Code Stroke).',
    incident: 'Emergency CT scan completed; window elapsed without manual extension.',
    startedAt: '12 Sep 2026 • 8:10 PM',
    startedAtShort: '12 Sep • 8:10 PM',
    endedAt: '12 Sep 2026 • 11:10 PM',
    accessType: 'Emergency Access',
    nominee: {
      name: 'Priya Sharma',
      relationship: 'Spouse',
      notificationSent: true,
      notificationSentAt: '12 Sep 2026 • 8:11 PM',
    },
    audit: {
      isRecorded: true,
      auditTime: '12 Sep 2026 • 8:10 PM',
      status: '✓ Recorded',
    },
    timeline: [
      { id: 't1', title: 'Doctor verified', time: '8:09 PM', isCompleted: true },
      { id: 't2', title: 'Emergency access started', time: '8:10 PM', isCompleted: true },
      { id: 't3', title: 'Nominee notified', time: '8:11 PM', isCompleted: true },
      { id: 't4', title: 'Audit recorded', time: '8:11 PM', isCompleted: true },
      { id: 't5', title: 'Access expired automatically', time: '11:10 PM', isCompleted: true },
    ],
  },
  {
    id: 'EMS-2026-006',
    status: 'EXPIRED',
    statusBadgeText: '○ EXPIRED',
    cardHeader: '○ Emergency Expired',
    doctor: {
      name: 'Dr. Priya Deshmukh',
      photoUrl: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=400',
      doctorId: 'DOC-20834',
      hospital: 'Apex Skin & Health Center',
      qualification: 'MBBS, MD',
      experience: '6 Years',
      isVerified: true,
    },
    patient: {
      name: 'Suresh Kumar',
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400',
      healthId: 'HP-100450',
      isVerified: true,
    },
    emergencyReason: 'Severe drug hypersensitivity and dermatological flare.',
    patientCondition: 'Widespread acute urticaria with facial angioedema.',
    incident: 'Antihistamine intervention administered; patient stabilized.',
    startedAt: '11 Sep 2026 • 2:00 PM',
    startedAtShort: '11 Sep • 2:00 PM',
    endedAt: '11 Sep 2026 • 5:00 PM',
    accessType: 'Emergency Access',
    nominee: {
      name: 'Sunita Kumar',
      relationship: 'Spouse',
      notificationSent: true,
      notificationSentAt: '11 Sep 2026 • 2:02 PM',
    },
    audit: {
      isRecorded: true,
      auditTime: '11 Sep 2026 • 2:00 PM',
      status: '✓ Recorded',
    },
    timeline: [
      { id: 't1', title: 'Doctor verified', time: '1:58 PM', isCompleted: true },
      { id: 't2', title: 'Emergency access started', time: '2:00 PM', isCompleted: true },
      { id: 't3', title: 'Nominee notified', time: '2:02 PM', isCompleted: true },
      { id: 't4', title: 'Audit recorded', time: '2:02 PM', isCompleted: true },
      { id: 't5', title: 'Access expired automatically', time: '5:00 PM', isCompleted: true },
    ],
  },
];

class EmergencyCareService {
  /**
   * Fetch all emergency sessions with optional delay
   */
  async getEmergencySessions(): Promise<EmergencySessionItem[]> {
    await new Promise((r) => setTimeout(r, 100));
    return MOCK_EMERGENCY_SESSIONS;
  }

  /**
   * Search across Doctor Name, Doctor ID, Patient Name, Health ID
   */
  async searchEmergencySessions(query: string): Promise<EmergencySessionItem[]> {
    await new Promise((r) => setTimeout(r, 100));
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_EMERGENCY_SESSIONS;

    return MOCK_EMERGENCY_SESSIONS.filter((s) => {
      const docName = s.doctor.name.toLowerCase();
      const docId = s.doctor.doctorId.toLowerCase();
      const patName = s.patient.name.toLowerCase();
      const patId = s.patient.healthId.toLowerCase();
      const hosp = s.doctor.hospital.toLowerCase();
      const reason = s.emergencyReason.toLowerCase();

      return (
        docName.includes(q) ||
        docId.includes(q) ||
        patName.includes(q) ||
        patId.includes(q) ||
        hosp.includes(q) ||
        reason.includes(q)
      );
    });
  }

  /**
   * Filter sessions by status
   */
  async filterEmergencySessions(
    status: EmergencyStatus | 'ALL',
    searchQuery: string = ''
  ): Promise<EmergencySessionItem[]> {
    await new Promise((r) => setTimeout(r, 80));
    let list = MOCK_EMERGENCY_SESSIONS;

    if (status !== 'ALL') {
      list = list.filter((s) => s.status === status);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((s) => {
        return (
          s.doctor.name.toLowerCase().includes(q) ||
          s.doctor.doctorId.toLowerCase().includes(q) ||
          s.patient.name.toLowerCase().includes(q) ||
          s.patient.healthId.toLowerCase().includes(q) ||
          s.doctor.hospital.toLowerCase().includes(q) ||
          s.emergencyReason.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }

  /**
   * Get single session details
   */
  async getEmergencySessionDetails(id: string): Promise<EmergencySessionItem | null> {
    await new Promise((r) => setTimeout(r, 100));
    const found = MOCK_EMERGENCY_SESSIONS.find((s) => s.id === id);
    return found || null;
  }

  /**
   * Get summary counts for header
   */
  getSummaryCounts(): { active: number; completed: number; expired: number } {
    return {
      active: 2,
      completed: 18,
      expired: 5,
    };
  }
}

export const emergencyCareService = new EmergencyCareService();
