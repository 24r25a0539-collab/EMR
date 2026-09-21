/**
 * Frontend Patient Directory Service (Doctor -> Patient Directory)
 *
 * Real PostgreSQL Database-Driven Patient Search and Access Request Management.
 *
 * Privacy Guarantees:
 * - Patient search results return ONLY identity fields (photo, name, healthId, verified status, identification marks).
 * - Aadhaar numbers are transmitted only in secure request bodies and NEVER exposed in results.
 * - Clinical/medical data are completely omitted from initial search results.
 */
import { api } from './api';

export type SearchFilterType = 'aadhaar' | 'healthId' | 'abhaId' | 'fullName';

export interface PatientIdentity {
  id: string;
  fullName: string;
  healthId: string;
  abhaId?: string;
  photoUrl?: string;
  isVerified: boolean;
  identityStatus?: string;
  identificationMarks: string[];
  accessStatus?: 'AUTHORIZED' | 'EMERGENCY_ACTIVE' | 'ACCESS_REQUIRED';
  activePermission?: any;
  activeEmergencySession?: any;
}

export type AccessScope =
  | 'Basic Profile'
  | 'Medical History'
  | 'Allergies'
  | 'Medical Conditions'
  | 'Medicines'
  | 'Prescriptions'
  | 'Reports'
  | 'Appointments'
  | 'Emergency Information'
  | 'Timeline'
  | 'Private Documents';

export const ALL_ACCESS_SCOPES: { id: AccessScope; key: string }[] = [
  { id: 'Basic Profile', key: 'scope.basicProfile' },
  { id: 'Medical History', key: 'scope.medicalHistory' },
  { id: 'Allergies', key: 'scope.allergies' },
  { id: 'Medical Conditions', key: 'scope.medicalConditions' },
  { id: 'Medicines', key: 'scope.medicines' },
  { id: 'Prescriptions', key: 'scope.prescriptions' },
  { id: 'Reports', key: 'scope.reports' },
  { id: 'Appointments', key: 'scope.appointments' },
  { id: 'Emergency Information', key: 'scope.emergencyInfo' },
  { id: 'Timeline', key: 'scope.timeline' },
  { id: 'Private Documents', key: 'scope.privateDocuments' },
];

export type AccessDuration =
  | '1 Hour'
  | '2 Hours'
  | '3 Hours'
  | '6 Hours'
  | '12 Hours'
  | '1 Day'
  | '2 Days'
  | '3 Days'
  | 'Custom';

export const ACCESS_DURATIONS: { label: AccessDuration; hours: number }[] = [
  { label: '1 Hour', hours: 1 },
  { label: '2 Hours', hours: 2 },
  { label: '3 Hours', hours: 3 },
  { label: '6 Hours', hours: 6 },
  { label: '12 Hours', hours: 12 },
  { label: '1 Day', hours: 24 },
  { label: '2 Days', hours: 48 },
  { label: '3 Days', hours: 72 }, // Default: 3 Days
  { label: 'Custom', hours: 168 },
];

export interface AccessRequestPayload {
  patientId: string;
  patientHealthId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty?: string;
  doctorHospital?: string;
  scopes: AccessScope[];
  clinicalReason: string;
  duration: AccessDuration;
  customHours?: number;
}

export interface MockAccessRequestRecord extends AccessRequestPayload {
  requestId: string;
  status: 'PENDING';
  requestedAt: number;
}

const STORAGE_PENDING_REQUESTS = 'emr_directory_pending_requests_v1';

class PatientDirectoryService {
  /**
   * Validates the search input according to the active search filter type.
   */
  public validateSearchInput(
    searchType: SearchFilterType,
    searchValue: string
  ): { isValid: boolean; errorMessageKey?: string; defaultMessage?: string } {
    const trimmed = searchValue.trim();
    if (!trimmed) {
      return {
        isValid: false,
        errorMessageKey: 'directory.emptySearchError',
        defaultMessage: 'Please enter a search query.',
      };
    }

    switch (searchType) {
      case 'aadhaar': {
        const digitsOnly = trimmed.replace(/\s|-/g, '');
        if (digitsOnly.length < 4) {
          return {
            isValid: false,
            errorMessageKey: 'directory.validAadhaar',
            defaultMessage: 'Please enter at least the last 4 digits of Aadhaar or full 12-digit number.',
          };
        }
        return { isValid: true };
      }

      case 'healthId': {
        if (trimmed.length < 2) {
          return {
            isValid: false,
            errorMessageKey: 'directory.validHealthId',
            defaultMessage: 'Please enter a valid Health ID (e.g., HP-100245).',
          };
        }
        return { isValid: true };
      }

      case 'abhaId': {
        if (trimmed.length < 2) {
          return {
            isValid: false,
            errorMessageKey: 'directory.validAbhaId',
            defaultMessage: 'Please enter a valid ABHA ID.',
          };
        }
        return { isValid: true };
      }

      case 'fullName': {
        if (trimmed.length < 1) {
          return {
            isValid: false,
            errorMessageKey: 'directory.validFullName',
            defaultMessage: 'Please enter a name to search.',
          };
        }
        return { isValid: true };
      }

      default:
        return { isValid: true };
    }
  }

  /**
   * Searches real patients from PostgreSQL database by search type and value.
   * Returns ONLY identity-only details (Photo, Name, Health ID, Verified Status, Identification Marks).
   */
  public async searchPatients(
    searchType: SearchFilterType,
    searchValue: string
  ): Promise<PatientIdentity[]> {
    const trimmed = searchValue.trim();
    if (!trimmed) return [];

    try {
      const res = await api.searchPatients(trimmed, searchType);
      if (res && res.success && Array.isArray(res.patients)) {
        return res.patients.map((p: any) => ({
          id: p.id,
          fullName: p.fullName || p.name || 'Patient',
          healthId: p.healthId || p.healthcareId || 'HP-000000',
          abhaId: p.abhaId,
          photoUrl: p.photoUrl,
          isVerified: p.identityStatus === 'VERIFIED' || !!p.isVerified,
          identityStatus: p.identityStatus || (p.isVerified ? 'VERIFIED' : 'PENDING'),
          identificationMarks: Array.isArray(p.identificationMarks) ? p.identificationMarks : [],
          accessStatus: p.accessStatus || 'ACCESS_REQUIRED',
          activePermission: p.activePermission || null,
          activeEmergencySession: p.activeEmergencySession || null,
        }));
      }
      return [];
    } catch (err) {
      console.error('Patient search failed:', err);
      return [];
    }
  }

  /**
   * Submits a new EMR Access Request to backend PostgreSQL database.
   */
  public async submitAccessRequest(
    payload: AccessRequestPayload
  ): Promise<{ success: boolean; requestId: string; status: 'PENDING' }> {
    try {
      const res = await api.createDoctorAccessRequest(
        payload.patientHealthId,
        payload.clinicalReason,
        payload.scopes,
        payload.duration
      );

      const requestId = res.accessRequest?.id || `req_${Date.now()}`;
      const newRecord: MockAccessRequestRecord = {
        ...payload,
        requestId,
        status: 'PENDING',
        requestedAt: Date.now(),
      };

      try {
        const stored = localStorage.getItem(STORAGE_PENDING_REQUESTS);
        const existing: MockAccessRequestRecord[] = stored ? JSON.parse(stored) : [];
        const filtered = existing.filter(
          (r) => !(r.doctorId === payload.doctorId && r.patientHealthId === payload.patientHealthId)
        );
        filtered.push(newRecord);
        localStorage.setItem(STORAGE_PENDING_REQUESTS, JSON.stringify(filtered));

        window.dispatchEvent(
          new CustomEvent('emr_access_request_created', { detail: newRecord })
        );
      } catch {}

      return {
        success: true,
        requestId,
        status: 'PENDING',
      };
    } catch (err: any) {
      throw new Error(err.message || 'Failed to submit access request.');
    }
  }

  /**
   * Checks whether there is an active or pending access request for the given patient.
   */
  public getPendingRequest(
    doctorId: string,
    patientHealthId: string
  ): MockAccessRequestRecord | null {
    try {
      const stored = localStorage.getItem(STORAGE_PENDING_REQUESTS);
      if (!stored) return null;
      const requests: MockAccessRequestRecord[] = JSON.parse(stored);
      return (
        requests.find(
          (r) => r.doctorId === doctorId && r.patientHealthId === patientHealthId
        ) || null
      );
    } catch {
      return null;
    }
  }
}

export const patientDirectoryService = new PatientDirectoryService();
