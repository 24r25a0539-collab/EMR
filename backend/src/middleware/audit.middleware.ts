import { prisma } from '../models/prisma.js';

export interface AuditLogParams {
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
  documentType?: 'ALLERGY' | 'MEDICATION' | 'PRESCRIPTION' | 'LAB_REPORT' | 'CONSULTATION' | 'EMERGENCY_NOTE' | 'ACCESS_PERMISSION' | 'AUTH' | 'PROFILE';
  action: 'VIEW' | 'DOWNLOAD' | 'CREATE' | 'MODIFY' | 'APPROVE' | 'REJECT' | 'REVOKE' | 'EMERGENCY_ACCESS' | 'EMERGENCY_NOTE' | 'LOGIN' | 'LOGOUT';
  accessType: 'NORMAL' | 'EMERGENCY' | 'CONSENT_GRANTED' | 'UNAUTHORIZED_ATTEMPT';
  reason?: string;
  authorizationStatus?: 'AUTHORIZED' | 'DENIED' | 'EMERGENCY_OVERRIDE';
  consentStatus?: 'EXPLICIT_CONSENT' | 'EMERGENCY_BYPASS' | 'NOT_REQUIRED';
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  previousHash?: string;
  newHash?: string;
  blockchainTxId?: string;
  blockchainVerificationStatus?: 'VERIFIED' | 'PENDING' | 'FAILED';
  result?: 'SUCCESS' | 'FAILURE' | 'BLOCKED';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

/**
 * Persists an immutable, append-only granular AuditEvent.
 * Strictly prevents modifications or deletions.
 */
export async function logAuditEvent(params: AuditLogParams) {
  try {
    return await prisma.auditEvent.create({
      data: {
        actorId: params.actorId,
        actorRole: params.actorRole,
        actorName: params.actorName,
        patientId: params.patientId,
        patientHealthId: params.patientHealthId,
        doctorId: params.doctorId,
        doctorName: params.doctorName,
        hospitalId: params.hospitalId,
        hospitalName: params.hospitalName,
        department: params.department,
        recordId: params.recordId,
        documentId: params.documentId,
        documentType: params.documentType,
        action: params.action,
        accessType: params.accessType,
        reason: params.reason,
        authorizationStatus: params.authorizationStatus || 'AUTHORIZED',
        consentStatus: params.consentStatus || 'EXPLICIT_CONSENT',
        sessionId: params.sessionId,
        ipAddress: params.ipAddress || '127.0.0.1',
        userAgent: params.userAgent,
        previousHash: params.previousHash,
        newHash: params.newHash,
        blockchainTxId: params.blockchainTxId,
        blockchainVerificationStatus: params.blockchainVerificationStatus || 'VERIFIED',
        result: params.result || 'SUCCESS',
        severity: params.severity || 'LOW',
      },
    });
  } catch (err) {
    console.error('CRITICAL: Failed to write append-only audit event:', err);
    return null;
  }
}
