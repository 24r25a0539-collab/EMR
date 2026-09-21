export interface AuditEventItem {
  id: string;
  action: string;
  actionType: 'VERIFICATION' | 'PERMISSION' | 'ACCESS' | 'SECURITY' | 'EMERGENCY' | 'VIEW';
  actor: string;
  actorRole: 'Doctor' | 'Patient' | 'System' | 'Admin' | 'EMS Paramedic';
  timestamp: number;
  dateStr: string;
  timeStr: string;
  targetResource: string;
  permissionStatus: string;
  integrityStatus: 'Verified ✓' | 'Warning ⚠' | 'Pending' | 'N/A';
  details?: string;
  sha256?: string;
}

const STORAGE_KEY = 'emr_patient_audit_v1';
const EVENT_NAME = 'emr_audit_changed';

const DEFAULT_AUDIT_EVENTS: AuditEventItem[] = [
  {
    id: 'aud-001',
    action: 'Medical Record Integrity Verified',
    actionType: 'VERIFICATION',
    actor: 'Cryptographic Security Engine',
    actorRole: 'System',
    timestamp: Date.now() - 12 * 60 * 1000,
    dateStr: 'Today',
    timeStr: '10:42 AM',
    targetResource: 'Lipid Profile & Vitals Baseline',
    permissionStatus: 'Citizen Sovereign Access',
    integrityStatus: 'Verified ✓',
    details: 'Zero mathematical variance detected against consensus ledger.',
    sha256: '0x8f3c7a21be892047cb59103e910248ad819203e4810294820192847291029482',
  },
  {
    id: 'aud-002',
    action: 'Lab Report Integrity Verified',
    actionType: 'VERIFICATION',
    actor: 'Consensus Verification Mesh',
    actorRole: 'System',
    timestamp: Date.now() - 14 * 60 * 1000,
    dateStr: 'Today',
    timeStr: '10:40 AM',
    targetResource: 'Metabolic Panel (LR-2024-001)',
    permissionStatus: 'Authorized Active Grant',
    integrityStatus: 'Verified ✓',
    details: 'SHA-256 seal matched block #10486.',
    sha256: '0x3a8f7129bca001928472910294820192847291029482019284729102948291c2',
  },
  {
    id: 'aud-003',
    action: 'Doctor Access Approved by Patient',
    actionType: 'PERMISSION',
    actor: 'Rahul Sharma',
    actorRole: 'Patient',
    timestamp: Date.now() - 35 * 60 * 1000,
    dateStr: 'Today',
    timeStr: '10:20 AM',
    targetResource: 'Dr. Rajesh Verma (Neurology)',
    permissionStatus: 'Approved (3 Days Duration)',
    integrityStatus: 'Verified ✓',
    details: 'Scopes: Prescriptions, Lab Reports. Expiry: 16 Sep 2026.',
  },
  {
    id: 'aud-004',
    action: 'Medical Report Viewed',
    actionType: 'VIEW',
    actor: 'Dr. Ananya Sharma',
    actorRole: 'Doctor',
    timestamp: Date.now() - 65 * 60 * 1000,
    dateStr: 'Today',
    timeStr: '09:45 AM',
    targetResource: 'Blood Test Report LR-2024-001',
    permissionStatus: 'Reports — Active',
    integrityStatus: 'Verified ✓',
    details: 'Read access authorized under patient sovereign consent.',
  },
  {
    id: 'aud-005',
    action: 'Doctor Searched for Patient',
    actionType: 'ACCESS',
    actor: 'Dr. Ananya Sharma',
    actorRole: 'Doctor',
    timestamp: Date.now() - 90 * 60 * 1000,
    dateStr: 'Today',
    timeStr: '09:20 AM',
    targetResource: 'Health ID: HP-100245',
    permissionStatus: 'Identity Only (No Clinical Access)',
    integrityStatus: 'Verified ✓',
    details: 'Demographic identification cards only. Clinical records remained locked.',
  },
  {
    id: 'aud-006',
    action: 'Emergency Access Triage Simulation Completed',
    actionType: 'EMERGENCY',
    actor: 'Trauma EMS Unit #4',
    actorRole: 'EMS Paramedic',
    timestamp: Date.now() - 24 * 3600 * 1000,
    dateStr: 'Yesterday',
    timeStr: '02:15 PM',
    targetResource: 'Blood Type & Penicillin Allergy',
    permissionStatus: 'Emergency Protocol (Tier 2 Callout)',
    integrityStatus: 'Verified ✓',
    details: 'Automated SMS broadcasted to primary emergency contact Priya Sharma (+91 98765 43211).',
  },
];

class AuditService {
  private loadEvents(): AuditEventItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.saveEvents(DEFAULT_AUDIT_EVENTS);
        return DEFAULT_AUDIT_EVENTS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_AUDIT_EVENTS;
    }
  }

  private saveEvents(events: AuditEventItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
      }
    } catch (e) {
      console.error('Failed to save audit events', e);
    }
  }

  public getAuditEvents(): AuditEventItem[] {
    return this.loadEvents();
  }

  public recordEvent(event: Omit<AuditEventItem, 'id' | 'timestamp' | 'dateStr' | 'timeStr'>): AuditEventItem {
    const list = this.loadEvents();
    const now = new Date();
    const newEvent: AuditEventItem = {
      id: `aud-${Date.now()}`,
      timestamp: Date.now(),
      dateStr: 'Today',
      timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...event,
    };
    list.unshift(newEvent);
    this.saveEvents(list);
    return newEvent;
  }

  public onAuditChange(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(EVENT_NAME, callback);
    return () => window.removeEventListener(EVENT_NAME, callback);
  }
}

export const auditService = new AuditService();
