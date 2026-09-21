import { auditService } from './auditService';

export interface SecurityAlertItem {
  id: string;
  type: 'UNAUTHORIZED_ATTEMPT' | 'PERMISSION_DENIED' | 'SUSPICIOUS_ACCESS' | 'ACCESS_REVOKED';
  title: string;
  description: string;
  timestamp: number;
  dateStr: string;
  timeStr: string;
  severity: 'HIGH' | 'MEDIUM' | 'INFO';
  resolved: boolean;
}

export interface ActiveSessionItem {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface EmergencyAccessLogItem {
  id: string;
  doctorName: string;
  hospital: string;
  reason: string;
  startedAt: string;
  endedAt?: string;
  status: 'ACTIVE' | 'CONCLUDED' | 'REVOKED';
  itemsAccessed: string[];
}

export interface SecuritySummaryState {
  passwordLastChanged: string;
  twoFactorEnabled: boolean;
  activeSessions: ActiveSessionItem[];
  emergencyLogs: EmergencyAccessLogItem[];
  securityAlerts: SecurityAlertItem[];
}

const STORAGE_KEY = 'emr_security_state_v1';
const EVENT_NAME = 'emr_security_changed';

const DEFAULT_STATE: SecuritySummaryState = {
  passwordLastChanged: '12 Aug 2026 (32 days ago)',
  twoFactorEnabled: true,
  activeSessions: [
    {
      id: 'sess-01',
      device: 'Chrome on Windows 11 (Desktop)',
      location: 'Hyderabad, Telangana, IN',
      ip: '10.240.12.84',
      lastActive: 'Active right now',
      isCurrent: true,
    },
    {
      id: 'sess-02',
      device: 'Apex Health Mobile App (iOS 17)',
      location: 'Hyderabad, Telangana, IN',
      ip: '10.240.14.19',
      lastActive: '2 hours ago',
      isCurrent: false,
    },
  ],
  emergencyLogs: [
    {
      id: 'em-log-01',
      doctorName: 'Dr. Vikram Malhotra (Trauma ER)',
      hospital: 'Apex Health City — Emergency Triage',
      reason: 'Acute road traffic trauma evaluation & baseline blood cross-match',
      startedAt: 'Yesterday, 02:15 PM',
      endedAt: 'Yesterday, 03:00 PM',
      status: 'CONCLUDED',
      itemsAccessed: ['Blood Group (O+)', 'Penicillin Allergy Alert', 'Emergency Contact'],
    },
  ],
  securityAlerts: [
    {
      id: 'alert-01',
      type: 'UNAUTHORIZED_ATTEMPT',
      title: 'Unauthorized Modification Attempt Blocked',
      description: 'Attempt to modify prescription records blocked due to missing practitioner edit clearance.',
      timestamp: Date.now() - 30 * 60 * 1000,
      dateStr: 'Today',
      timeStr: '10:30 AM',
      severity: 'HIGH',
      resolved: false,
    },
  ],
};

class SecurityService {
  private loadState(): SecuritySummaryState {
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

  private saveState(state: SecuritySummaryState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
      }
    } catch (e) {
      console.error('Failed to save security state', e);
    }
  }

  public getState(): SecuritySummaryState {
    return this.loadState();
  }

  /**
   * UX permission guard:
   * Rejects unauthorized record modification attempts, displays "Access Denied",
   * records an audit trail event, and registers a security alert without modifying data.
   */
  public attemptUnauthorizedModification(
    targetRecord: string = 'Prescription: Metformin 500mg',
    attemptedAction: string = 'Edit Prescription'
  ): { allowed: boolean; message: string } {
    const state = this.loadState();
    const now = new Date();

    // 1. Log security alert
    const newAlert: SecurityAlertItem = {
      id: `alert-${Date.now()}`,
      type: 'UNAUTHORIZED_ATTEMPT',
      title: 'Unauthorized Modification Attempt Blocked',
      description: `Attempted "${attemptedAction}" on "${targetRecord}" was rejected by sovereign permission guard.`,
      timestamp: Date.now(),
      dateStr: 'Today',
      timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      severity: 'HIGH',
      resolved: false,
    };
    state.securityAlerts.unshift(newAlert);
    this.saveState(state);

    // 2. Record in Audit Trail
    auditService.recordEvent({
      action: 'Unauthorized Modification Attempt Blocked',
      actionType: 'SECURITY',
      actor: 'External Practitioner / Unverified Actor',
      actorRole: 'Doctor',
      targetResource: targetRecord,
      permissionStatus: 'Permission Denied',
      integrityStatus: 'Warning ⚠',
      details: `Action "${attemptedAction}" halted. No write authorization found. Data integrity preserved.`,
    });

    return {
      allowed: false,
      message: "Access Denied: You don't have permission to modify this medical record.",
    };
  }

  public revokeSession(sessionId: string) {
    const state = this.loadState();
    state.activeSessions = state.activeSessions.filter((s) => s.id !== sessionId || s.isCurrent);
    this.saveState(state);
  }

  public dismissAlert(alertId: string) {
    const state = this.loadState();
    state.securityAlerts = state.securityAlerts.map((a) => (a.id === alertId ? { ...a, resolved: true } : a));
    this.saveState(state);
  }

  public onSecurityChange(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(EVENT_NAME, callback);
    return () => window.removeEventListener(EVENT_NAME, callback);
  }
}

export const securityService = new SecurityService();
