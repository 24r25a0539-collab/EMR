export type IntegrityStatus = 'SECURE' | 'CHECKING' | 'WARNING' | 'ISSUE_DETECTED' | 'ERROR';

export interface RecordIntegrityItem {
  id: string;
  name: string;
  type: string;
  sha256: string;
  blockNumber: number;
  verifiedAt: string;
  status: 'VERIFIED' | 'WARNING' | 'ERROR';
}

export interface IntegrityState {
  status: IntegrityStatus;
  recordsChecked: number;
  recordsVerified: number;
  issuesCount: number;
  lastCheckedTime: number; // timestamp
  merkleRoot: string;
  consensusNode: string;
  blockNumber: number;
  recordItems: RecordIntegrityItem[];
}

const STORAGE_KEY = 'emr_integrity_state_v1';
const EVENT_NAME = 'emr_integrity_changed';

const DEFAULT_STATE: IntegrityState = {
  status: 'SECURE',
  recordsChecked: 14,
  recordsVerified: 14,
  issuesCount: 0,
  lastCheckedTime: Date.now(),
  merkleRoot: '0x8f3c7a21be892047cb59103e910248ad819203e4810294820192847291029482',
  consensusNode: 'Apex Sovereign Health Consensus Mesh (Node #01)',
  blockNumber: 10486,
  recordItems: [
    { id: 'REC-01', name: 'Comprehensive Metabolic Panel (LR-2024-001)', type: 'Lab Report', sha256: '0x3a8f...91c2', blockNumber: 10486, verifiedAt: 'Today, 10:42 AM', status: 'VERIFIED' },
    { id: 'REC-02', name: 'Prescription: Telmisartan & Metformin (RX-2026-901)', type: 'Prescription', sha256: '0x7e12...b440', blockNumber: 10485, verifiedAt: 'Today, 10:40 AM', status: 'VERIFIED' },
    { id: 'REC-03', name: 'Cardiology Baseline ECG Strip', type: 'Clinical Investigation', sha256: '0x9920...a118', blockNumber: 10482, verifiedAt: 'Yesterday, 04:15 PM', status: 'VERIFIED' },
    { id: 'REC-04', name: 'HbA1c Glycemic Monitoring Record', type: 'Lab Report', sha256: '0x5c88...e392', blockNumber: 10478, verifiedAt: '10 Sep 2026', status: 'VERIFIED' },
    { id: 'REC-05', name: 'Lipid Profile Report', type: 'Lab Report', sha256: '0x12bb...87ef', blockNumber: 10475, verifiedAt: '08 Sep 2026', status: 'VERIFIED' },
    { id: 'REC-06', name: 'Consultation Note: Dr. Ananya Sharma', type: 'Consultation', sha256: '0x8892...fa01', blockNumber: 10471, verifiedAt: '05 Sep 2026', status: 'VERIFIED' },
    { id: 'REC-07', name: 'Ultrasound Carotid Doppler', type: 'Imaging', sha256: '0x6641...33d8', blockNumber: 10465, verifiedAt: '28 Aug 2026', status: 'VERIFIED' },
    { id: 'REC-08', name: 'Prescription: Rosuvastatin 10mg (RX-2026-840)', type: 'Prescription', sha256: '0x2217...e5a9', blockNumber: 10460, verifiedAt: '20 Aug 2026', status: 'VERIFIED' },
    { id: 'REC-09', name: 'Vaccination Proof: COVID-19 Booster', type: 'Immunization', sha256: '0x9043...bc71', blockNumber: 10452, verifiedAt: '12 Aug 2026', status: 'VERIFIED' },
    { id: 'REC-10', name: 'Echocardiogram 2D Doppler Study', type: 'Imaging', sha256: '0x4381...99ef', blockNumber: 10444, verifiedAt: '02 Aug 2026', status: 'VERIFIED' },
    { id: 'REC-11', name: 'Allergy Evaluation Record', type: 'Clinical Baseline', sha256: '0x7754...11bb', blockNumber: 10438, verifiedAt: '15 Jul 2026', status: 'VERIFIED' },
    { id: 'REC-12', name: 'Neurology Consultation: Dr. Rajesh Verma', type: 'Consultation', sha256: '0x3391...440c', blockNumber: 10430, verifiedAt: '01 Jul 2026', status: 'VERIFIED' },
    { id: 'REC-13', name: 'Emergency Admission Clearance', type: 'Triage Clearance', sha256: '0x5582...88df', blockNumber: 10425, verifiedAt: '14 Jun 2026', status: 'VERIFIED' },
    { id: 'REC-14', name: 'Sovereign Health Identity Genesis Proof', type: 'Citizen Identity', sha256: '0x1102...fa55', blockNumber: 10400, verifiedAt: '01 Jan 2026', status: 'VERIFIED' },
  ],
};

class IntegrityService {
  private loadState(): IntegrityState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.saveState(DEFAULT_STATE);
        return DEFAULT_STATE;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_STATE;
    }
  }

  private saveState(state: IntegrityState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
      }
    } catch (e) {
      console.error('Failed to save integrity state', e);
    }
  }

  public getState(): IntegrityState {
    return this.loadState();
  }

  public getRelativeTimeString(timestamp: number): string {
    const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSeconds < 30) return 'Just now';
    if (diffSeconds < 60) return '1 minute ago';
    const mins = Math.floor(diffSeconds / 60);
    if (mins < 60) return `${mins} minutes ago`;
    const hours = Math.floor(mins / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  }

  /**
   * Simulates an interactive re-verification of all records
   */
  public async verifyNow(): Promise<IntegrityState> {
    const curr = this.loadState();
    // 1. Set status to CHECKING
    this.saveState({ ...curr, status: 'CHECKING' });

    // 2. Wait 1200ms to simulate verification
    await new Promise((r) => setTimeout(r, 1200));

    // 3. Complete and return to SECURE with fresh timestamp
    const updated: IntegrityState = {
      ...curr,
      status: 'SECURE',
      lastCheckedTime: Date.now(),
      recordsChecked: curr.recordItems.length,
      recordsVerified: curr.recordItems.length,
      issuesCount: 0,
      blockNumber: curr.blockNumber + 1,
    };
    this.saveState(updated);
    return updated;
  }

  public setSimulatedStatus(status: IntegrityStatus, issuesCount: number = 0): IntegrityState {
    const curr = this.loadState();
    const updated: IntegrityState = {
      ...curr,
      status,
      issuesCount,
      lastCheckedTime: Date.now(),
    };
    this.saveState(updated);
    return updated;
  }

  public onIntegrityChange(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(EVENT_NAME, callback);
    return () => window.removeEventListener(EVENT_NAME, callback);
  }
}

export const integrityService = new IntegrityService();
