import { auditService } from './auditService';

export type PermissionStatus = 'NO_PERMISSION' | 'PENDING' | 'ACTIVE' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REVOKED';

export type DurationOption =
  | '1 Hour'
  | '2 Hours'
  | '3 Hours'
  | '6 Hours'
  | '12 Hours'
  | '1 Day'
  | '2 Days'
  | '3 Days'
  | 'Custom';

export const PRESET_DURATIONS: { label: DurationOption; hours: number }[] = [
  { label: '1 Hour', hours: 1 },
  { label: '2 Hours', hours: 2 },
  { label: '3 Hours', hours: 3 },
  { label: '6 Hours', hours: 6 },
  { label: '12 Hours', hours: 12 },
  { label: '1 Day', hours: 24 },
  { label: '2 Days', hours: 48 },
  { label: '3 Days', hours: 72 }, // DEFAULT
];

export interface PermissionGrant {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorHospital: string;
  doctorQualification?: string;
  doctorLicenseNo?: string;
  doctorPhoto?: string;
  isVerifiedDoctor?: boolean;
  reason: string;
  scopes: string[];
  durationLabel: DurationOption;
  durationHours: number;
  customStartDate?: string;
  customEndDate?: string;
  status: PermissionStatus;
  createdAt: number;
  approvedAt?: number;
  expiresAt?: number;
  rejectionReason?: string;
  revokedAt?: number;
}

export interface AccessCheckResult {
  allowed: boolean;
  status: PermissionStatus;
  message: string;
  grant?: PermissionGrant;
  scopeAllowed?: boolean;
}

const STORAGE_KEY = 'emr_permissions_v3';
const EVENT_NAME = 'emr_permission_changed';

const DEFAULT_GRANTS: PermissionGrant[] = [];

class PermissionService {
  private loadGrants(): PermissionGrant[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.saveGrants(DEFAULT_GRANTS);
        return DEFAULT_GRANTS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_GRANTS;
    }
  }

  private saveGrants(grants: PermissionGrant[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(grants));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
      }
    } catch (e) {
      console.error('Failed to save permissions to localStorage', e);
    }
  }

  public getAllGrants(): PermissionGrant[] {
    return this.loadGrants();
  }

  public getPatientGrants(patientId: string): PermissionGrant[] {
    const grants = this.loadGrants();
    const now = Date.now();
    let updated = false;

    // Auto-expire grants whose expiresAt has passed
    const evaluated = grants.map((g) => {
      if ((g.status === 'ACTIVE' || g.status === 'APPROVED') && g.expiresAt && now > g.expiresAt) {
        updated = true;
        return { ...g, status: 'EXPIRED' as PermissionStatus };
      }
      return g;
    });

    if (updated) {
      this.saveGrants(evaluated);
    }

    const norm = patientId.toLowerCase();
    return evaluated.filter(
      (g) => g.patientId.toLowerCase() === norm
    );
  }

  public getDoctorGrant(doctorId: string, patientId: string): PermissionGrant | null {
    const grants = this.getPatientGrants(patientId);
    return (
      grants.find(
        (g) =>
          (g.doctorId === doctorId || doctorId === 'doc_current') &&
          g.patientId.toLowerCase() === patientId.toLowerCase()
      ) || null
    );
  }

  public canAccessPatientEMR(
    doctorId: string,
    patientId: string,
    requiredScope?: string
  ): AccessCheckResult {
    const grant = this.getDoctorGrant(doctorId, patientId);

    if (!grant) {
      return {
        allowed: false,
        status: 'NO_PERMISSION',
        message: 'EMR Access Not Granted. Doctor must submit an EMR access request.',
      };
    }

    if ((grant.status === 'ACTIVE' || grant.status === 'APPROVED') && grant.expiresAt && Date.now() > grant.expiresAt) {
      this.simulateExpireGrant(grant.id);
      return {
        allowed: false,
        status: 'EXPIRED',
        message: 'Your access permission has expired.',
        grant: { ...grant, status: 'EXPIRED' },
      };
    }

    if (grant.status === 'PENDING') {
      return {
        allowed: false,
        status: 'PENDING',
        message: 'Access Request Pending. Awaiting patient consent approval.',
        grant,
      };
    }

    if (grant.status === 'REJECTED') {
      return {
        allowed: false,
        status: 'REJECTED',
        message: grant.rejectionReason
          ? `Access Request Rejected: ${grant.rejectionReason}`
          : 'Access Request Rejected by the patient.',
        grant,
      };
    }

    if (grant.status === 'REVOKED') {
      return {
        allowed: false,
        status: 'REVOKED',
        message: "Your access to this patient's medical records has been revoked.",
        grant,
      };
    }

    if (grant.status === 'EXPIRED') {
      return {
        allowed: false,
        status: 'EXPIRED',
        message: 'Your access permission has expired.',
        grant,
      };
    }

    if (requiredScope) {
      const normRequired = requiredScope.toLowerCase().trim();
      const hasScope =
        grant.scopes.some(
          (s) =>
            s.toLowerCase().trim() === normRequired ||
            s.toLowerCase().includes('full emr') ||
            s.toLowerCase().includes('all')
        ) ||
        (normRequired.includes('report') && grant.scopes.some((s) => s.toLowerCase().includes('report'))) ||
        (normRequired.includes('prescription') && grant.scopes.some((s) => s.toLowerCase().includes('prescription'))) ||
        (normRequired.includes('medicine') && (grant.scopes.some((s) => s.toLowerCase().includes('medicine')) || grant.scopes.some((s) => s.toLowerCase().includes('prescription')))) ||
        (normRequired.includes('cardio') && grant.scopes.some((s) => s.toLowerCase().includes('cardio'))) ||
        (normRequired.includes('history') && grant.scopes.some((s) => s.toLowerCase().includes('history'))) ||
        (normRequired.includes('consultation') && (grant.scopes.some((s) => s.toLowerCase().includes('consultation')) || grant.scopes.some((s) => s.toLowerCase().includes('history'))));

      if (!hasScope) {
        return {
          allowed: false,
          status: 'ACTIVE',
          scopeAllowed: false,
          message: `Scope restriction: "${requiredScope}" is not in the patient's approved consent clearance.`,
          grant,
        };
      }
    }

    return {
      allowed: true,
      status: 'ACTIVE',
      scopeAllowed: true,
      message: 'Access Granted: Patient consent is active.',
      grant,
    };
  }

  public requestAccess(
    patientId: string,
    doctorId: string,
    doctorName: string,
    doctorSpecialty: string,
    doctorHospital: string,
    reason: string,
    scopes: string[],
    durationHours: number,
    doctorPhoto?: string
  ): PermissionGrant {
    const grants = this.loadGrants();
    const newGrant: PermissionGrant = {
      id: `grant-req-${Date.now().toString().slice(-6)}`,
      patientId,
      doctorId,
      doctorName,
      doctorSpecialty,
      doctorHospital,
      doctorPhoto,
      reason,
      scopes: scopes.length > 0 ? scopes : ['Reports', 'Prescriptions'],
      durationLabel: durationHours === 72 ? '3 Days' : durationHours === 24 ? '1 Day' : '3 Days',
      durationHours: durationHours || 72,
      status: 'PENDING',
      createdAt: Date.now(),
    };

    const filtered = grants.filter(
      (g) => !(g.doctorId === doctorId && g.patientId === patientId)
    );
    filtered.unshift(newGrant);
    this.saveGrants(filtered);
    return newGrant;
  }

  public grantAccess(params: {
    patientId?: string;
    doctorId: string;
    doctorName: string;
    doctorSpecialty: string;
    doctorHospital: string;
    reason: string;
    scopes: string[];
    durationHours: number;
    doctorPhoto?: string;
  }): PermissionGrant {
    return this.requestAccess(
      params.patientId || 'HP-100245',
      params.doctorId,
      params.doctorName,
      params.doctorSpecialty,
      params.doctorHospital,
      params.reason,
      params.scopes,
      params.durationHours,
      params.doctorPhoto
    );
  }

  public getRemainingDurationString(target?: number | string): string {
    if (!target) return '';
    let expiresAt: number | undefined;
    if (typeof target === 'string') {
      const grant = this.loadGrants().find((g) => g.id === target);
      expiresAt = grant?.expiresAt;
    } else {
      expiresAt = target;
    }
    if (!expiresAt) return '';

    const diffMs = expiresAt - Date.now();
    if (diffMs <= 0) return 'Expired';

    const diffMinutes = Math.floor(diffMs / (60 * 1000));
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 1) {
      return remainingHours > 0
        ? `${days} days ${remainingHours} hours remaining`
        : `${days} days remaining`;
    }
    if (days === 1) {
      return remainingHours > 0
        ? `1 day ${remainingHours} hours remaining`
        : '1 day remaining';
    }
    if (hours > 1) {
      return `${hours} hours remaining`;
    }
    if (hours === 1) {
      return '1 hour remaining';
    }
    if (mins > 0) {
      return `${mins} minutes remaining (Expires soon)`;
    }
    return 'Expires soon';
  }

  public approveRequest(
    grantId: string,
    approvedScopes: string[],
    durationOption: DurationOption = '3 Days',
    durationHours: number = 72,
    customDates?: { start: string; end: string }
  ): PermissionGrant | null {
    const grants = this.loadGrants();
    let updatedGrant: PermissionGrant | null = null;

    const next = grants.map((g) => {
      if (g.id === grantId) {
        const now = Date.now();
        let expiresAt: number;

        if (durationOption === 'Custom' && customDates && customDates.end) {
          expiresAt = new Date(customDates.end).getTime();
        } else {
          expiresAt = now + durationHours * 3600 * 1000;
        }

        updatedGrant = {
          ...g,
          status: 'ACTIVE' as PermissionStatus,
          scopes: approvedScopes,
          durationLabel: durationOption,
          durationHours: durationHours,
          customStartDate: customDates?.start,
          customEndDate: customDates?.end,
          approvedAt: now,
          expiresAt: expiresAt,
        };
        return updatedGrant;
      }
      return g;
    });

    if (updatedGrant) {
      const grantItem: PermissionGrant = updatedGrant;
      this.saveGrants(next);
      auditService.recordEvent({
        action: 'Doctor Access Approved by Patient',
        actionType: 'PERMISSION',
        actor: 'Rahul Sharma',
        actorRole: 'Patient',
        targetResource: grantItem.doctorName,
        permissionStatus: `Active (${durationOption})`,
        integrityStatus: 'Verified ✓',
        details: `Granted scopes: ${approvedScopes.join(', ')}. Access expires at ${new Date(grantItem.expiresAt!).toLocaleString()}.`,
      });
    }
    return updatedGrant;
  }

  public approveGrant(
    grantId: string,
    durationHours?: number,
    approvedScopes?: string[]
  ): PermissionGrant | null {
    const grant = this.loadGrants().find((g) => g.id === grantId);
    const scopes = approvedScopes || (grant ? grant.scopes : ['Reports', 'Prescriptions']);
    const hours = durationHours || (grant ? grant.durationHours : 72);
    let durationOption: DurationOption = '3 Days';
    if (hours === 1) durationOption = '1 Hour';
    else if (hours === 2) durationOption = '2 Hours';
    else if (hours === 3) durationOption = '3 Hours';
    else if (hours === 6) durationOption = '6 Hours';
    else if (hours === 12) durationOption = '12 Hours';
    else if (hours === 24) durationOption = '1 Day';
    else if (hours === 48) durationOption = '2 Days';
    else if (hours === 72) durationOption = '3 Days';
    else durationOption = 'Custom';

    return this.approveRequest(
      grantId,
      scopes,
      durationOption,
      hours
    );
  }

  public rejectRequest(grantId: string, reason?: string): PermissionGrant | null {
    const grants = this.loadGrants();
    let updatedGrant: PermissionGrant | null = null;

    const next = grants.map((g) => {
      if (g.id === grantId) {
        updatedGrant = {
          ...g,
          status: 'REJECTED' as PermissionStatus,
          rejectionReason: reason || 'Patient declined consent clearance.',
        };
        return updatedGrant;
      }
      return g;
    });

    if (updatedGrant) {
      const grantItem: PermissionGrant = updatedGrant;
      this.saveGrants(next);
      auditService.recordEvent({
        action: 'Doctor Access Request Rejected',
        actionType: 'PERMISSION',
        actor: 'Rahul Sharma',
        actorRole: 'Patient',
        targetResource: grantItem.doctorName,
        permissionStatus: 'Request Rejected',
        integrityStatus: 'Verified ✓',
        details: reason || 'Patient declined consent clearance.',
      });
    }
    return updatedGrant;
  }

  public rejectGrant(grantId: string, reason?: string): PermissionGrant | null {
    return this.rejectRequest(grantId, reason);
  }

  public revokeGrant(grantId: string): PermissionGrant | null {
    const grants = this.loadGrants();
    let updatedGrant: PermissionGrant | null = null;

    const next = grants.map((g) => {
      if (g.id === grantId) {
        updatedGrant = {
          ...g,
          status: 'REVOKED' as PermissionStatus,
          revokedAt: Date.now(),
        };
        return updatedGrant;
      }
      return g;
    });

    if (updatedGrant) {
      const grantItem: PermissionGrant = updatedGrant;
      this.saveGrants(next);
      auditService.recordEvent({
        action: 'Doctor Access Revoked by Patient',
        actionType: 'PERMISSION',
        actor: 'Rahul Sharma',
        actorRole: 'Patient',
        targetResource: grantItem.doctorName,
        permissionStatus: 'Access Revoked',
        integrityStatus: 'Verified ✓',
        details: 'Active access grant immediately revoked.',
      });
    }
    return updatedGrant;
  }

  public simulateExpireGrant(grantId: string): PermissionGrant | null {
    const grants = this.loadGrants();
    let updatedGrant: PermissionGrant | null = null;

    const next = grants.map((g) => {
      if (g.id === grantId) {
        updatedGrant = {
          ...g,
          status: 'EXPIRED' as PermissionStatus,
          expiresAt: Date.now() - 1000,
        };
        return updatedGrant;
      }
      return g;
    });

    if (updatedGrant) {
      this.saveGrants(next);
    }
    return updatedGrant;
  }

  public onPermissionChange(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(EVENT_NAME, callback);
    return () => window.removeEventListener(EVENT_NAME, callback);
  }
}

export const permissionService = new PermissionService();
