import { Request, Response } from 'express';
import { prisma } from '../models/prisma.js';
import { logAuditEvent } from '../middleware/audit.middleware.js';
import { blockchainService } from '../services/blockchain.service.js';
import { calculateCanonicalSha256 } from '../utils/crypto.js';

export class DoctorController {
  /**
   * Get doctor dashboard overview.
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;

    if (!doctorId) {
      res.status(403).json({ success: false, error: 'DOCTOR_PROFILE_REQUIRED' });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const [todayAppointments, totalAppointments, pendingRequests, activeEmergencies, unreadNotifications] = await Promise.all([
      prisma.appointment.findMany({
        where: { doctorId, date: todayStr },
        include: { patient: true, hospital: true },
        orderBy: { timeSlot: 'asc' },
      }),
      prisma.appointment.count({ where: { doctorId } }),
      prisma.accessRequest.count({ where: { doctorId, status: 'PENDING' } }),
      prisma.emergencySession.count({ where: { doctorId, status: 'ACTIVE' } }),
      prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
    ]);

    res.json({
      success: true,
      stats: {
        todayAppointmentsCount: todayAppointments.length,
        totalAppointmentsCount: totalAppointments,
        pendingAccessRequestsCount: pendingRequests,
        activeEmergencySessionsCount: activeEmergencies,
        unreadNotificationsCount: unreadNotifications,
      },
      todayAppointments,
    });
  }

  /**
   * Get doctor profile and verification status.
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        affiliations: { include: { hospital: true } },
      },
    });

    if (!doctor) {
      res.status(404).json({ success: false, error: 'Doctor profile not found' });
      return;
    }

    res.json({ success: true, doctor });
  }

  /**
   * Update doctor availability and settings.
   */
  async updateSettings(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;
    const { workingDays, workingHours, appointmentDuration, consultationTypes } = req.body;

    const updated = await prisma.doctor.update({
      where: { id: doctorId },
      data: {
        workingDays,
        workingHours,
        appointmentDuration: appointmentDuration ? parseInt(appointmentDuration, 10) : undefined,
        consultationTypes,
      },
    });

    res.json({ success: true, message: 'Doctor availability updated.', doctor: updated });
  }

  /**
   * Get doctor's audit history (actions performed by doctor or clinical access).
   */
  async getAuditHistory(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;
    const actorId = req.user?.id;

    if (!doctorId && !actorId) {
      res.status(403).json({ success: false, error: 'DOCTOR_PROFILE_REQUIRED' });
      return;
    }

    const audits = await prisma.auditEvent.findMany({
      where: {
        OR: [
          ...(doctorId ? [{ doctorId }] : []),
          ...(actorId ? [{ actorId }] : []),
        ],
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    res.json({ success: true, audits, data: audits });
  }

  /**
   * Search patients by Health ID, name, Aadhaar, or ABHA ID.
   * Supports both GET and POST requests.
   * Returns STRICTLY identity-only details (Photo, Name, Health ID, Verified Status, Identification Marks).
   * NEVER exposes clinical records, blood group, allergies, conditions, or prescriptions prior to consent.
   */
  async searchPatients(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;
    const rawQuery = (req.query.query || req.body.query || req.query.search || req.body.search || req.query.identifier || req.body.identifier || req.query.q || '') as string;
    const searchType = ((req.query.type || req.body.type || req.query.searchType || req.body.searchType || 'all') as string).toLowerCase().trim();

    if (!rawQuery || typeof rawQuery !== 'string' || !rawQuery.trim()) {
      res.json({ success: true, patients: [] });
      return;
    }

    const cleanQuery = rawQuery.trim();
    let whereClause: any = {};

    if (searchType === 'healthid' || searchType === 'health_id') {
      whereClause = {
        healthId: { contains: cleanQuery, mode: 'insensitive' },
      };
    } else if (searchType === 'abha' || searchType === 'abhaid' || searchType === 'abha_id') {
      whereClause = {
        OR: [
          { emergencyNotes: { contains: cleanQuery, mode: 'insensitive' } },
          { healthId: { contains: cleanQuery, mode: 'insensitive' } },
        ],
      };
    } else if (searchType === 'name' || searchType === 'fullname' || searchType === 'full_name') {
      whereClause = {
        fullName: { contains: cleanQuery, mode: 'insensitive' },
      };
    } else if (searchType === 'aadhaar' || searchType === 'aadhaar_number' || searchType === 'govt_id') {
      const digitsOnly = cleanQuery.replace(/\D/g, '');
      const last4 = digitsOnly.slice(-4);
      whereClause = {
        govtIdNumberMasked: { contains: last4 ? last4 : cleanQuery },
      };
    } else {
      // General multi-field lookup
      const digitsOnly = cleanQuery.replace(/\D/g, '');
      const last4 = digitsOnly.length >= 4 ? digitsOnly.slice(-4) : '';
      whereClause = {
        OR: [
          { healthId: { contains: cleanQuery, mode: 'insensitive' } },
          { fullName: { contains: cleanQuery, mode: 'insensitive' } },
          ...(last4 ? [{ govtIdNumberMasked: { contains: last4 } }] : []),
          { emergencyNotes: { contains: cleanQuery, mode: 'insensitive' } },
          { user: { mobile: { contains: cleanQuery } } },
        ],
      };
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      include: {
        permissions: {
          where: {
            doctorId,
            status: 'ACTIVE',
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        },
        emergencySessions: {
          where: {
            doctorId,
            status: 'ACTIVE',
            autoExpiryTime: { gt: new Date() },
          },
        },
      },
      take: 20,
    });

    // Map to secure preview: Expose ONLY identity details (Photo, Name, Health ID, Verified Status, Identification Marks)
    // NEVER expose blood group, allergies, conditions, medicines, reports before consent/emergency!
    const sanitized = patients.map((p) => {
      const hasPermission = p.permissions.length > 0;
      const hasEmergency = p.emergencySessions.length > 0;

      let marks: string[] = [];
      let abha: string | undefined = undefined;
      if (p.emergencyNotes) {
        try {
          const parsed = JSON.parse(p.emergencyNotes);
          if (parsed && typeof parsed === 'object') {
            marks = Array.isArray(parsed.identificationMarks) ? parsed.identificationMarks : [];
            abha = parsed.abhaId;
          }
        } catch {}
      }

      return {
        id: p.id,
        healthId: p.healthId,
        healthcareId: p.healthId,
        fullName: p.fullName,
        name: p.fullName,
        gender: p.gender,
        identityStatus: p.identityStatus,
        isVerified: p.identityStatus === 'VERIFIED',
        identificationMarks: marks,
        abhaId: abha,
        accessStatus: hasEmergency ? 'EMERGENCY_ACTIVE' : hasPermission ? 'AUTHORIZED' : 'ACCESS_REQUIRED',
        activePermission: p.permissions[0] || null,
        activeEmergencySession: p.emergencySessions[0] || null,
      };
    });

    res.json({ success: true, patients: sanitized });
  }

  /**
   * Get list of patients for whom this doctor has active EMR permission or emergency session.
   * Used by Current Patient module.
   */
  async getAuthorizedPatients(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      res.status(403).json({ success: false, error: 'Doctor ID required' });
      return;
    }

    // Find active permissions
    const activePermissions = await prisma.permission.findMany({
      where: {
        doctorId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Find active emergency sessions
    const activeEmergencies = await prisma.emergencySession.findMany({
      where: {
        doctorId,
        status: 'ACTIVE',
        autoExpiryTime: { gt: new Date() },
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const patientMap = new Map<string, any>();

    for (const perm of activePermissions) {
      const p = perm.patient;
      if (!patientMap.has(p.id)) {
        let marks: string[] = [];
        let abha: string | undefined = undefined;
        if (p.emergencyNotes) {
          try {
            const parsed = JSON.parse(p.emergencyNotes);
            if (parsed && typeof parsed === 'object') {
              marks = Array.isArray(parsed.identificationMarks) ? parsed.identificationMarks : [];
              abha = parsed.abhaId;
            }
          } catch {}
        }

        patientMap.set(p.id, {
          id: p.id,
          healthId: p.healthId,
          healthcareId: p.healthId,
          fullName: p.fullName,
          name: p.fullName,
          gender: p.gender,
          dob: p.dob,
          dateOfBirth: p.dob,
          bloodGroup: p.bloodGroup,
          profilePhoto: null,
          identityStatus: p.identityStatus,
          isVerified: p.identityStatus === 'VERIFIED',
          identificationMarks: marks,
          abhaId: abha,
          accessStatus: 'AUTHORIZED',
          activePermission: {
            id: perm.id,
            scopeJson: perm.scopeJson,
            approvedScope: perm.scopeJson,
            expiresAt: perm.expiresAt,
            createdAt: perm.createdAt,
          },
          grantedAt: perm.createdAt,
          expiresAt: perm.expiresAt,
        });
      }
    }

    for (const em of activeEmergencies) {
      const p = em.patient;
      if (!patientMap.has(p.id)) {
        patientMap.set(p.id, {
          id: p.id,
          healthId: p.healthId,
          healthcareId: p.healthId,
          fullName: p.fullName,
          name: p.fullName,
          gender: p.gender,
          dob: p.dob,
          dateOfBirth: p.dob,
          bloodGroup: p.bloodGroup,
          profilePhoto: null,
          identityStatus: p.identityStatus,
          isVerified: p.identityStatus === 'VERIFIED',
          identificationMarks: [],
          accessStatus: 'EMERGENCY_ACTIVE',
          activeEmergencySession: em,
          grantedAt: em.createdAt,
          expiresAt: em.autoExpiryTime,
        });
      }
    }

    const patients = Array.from(patientMap.values());
    res.json({ success: true, patients });
  }

  /**
   * Create access request to patient's medical records.
   */
  async createAccessRequest(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;
    let healthId = req.body.healthId || req.body.patientHealthId;
    const patientId = req.body.patientId;

    const { reason, scopes = ['CONSULTATIONS', 'PRESCRIPTIONS', 'LAB_REPORTS'], requestedDuration = '7_DAYS' } = req.body;

    if (!healthId && !patientId) {
      res.status(400).json({ success: false, error: 'Health ID or Patient ID is required.' });
      return;
    }
    if (!reason) {
      res.status(400).json({ success: false, error: 'Reason is required.' });
      return;
    }

    const patient = patientId
      ? await prisma.patient.findUnique({ where: { id: patientId }, include: { user: true } })
      : await prisma.patient.findUnique({ where: { healthId }, include: { user: true } });

    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient not found.' });
      return;
    }


    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor || doctor.regStatus !== 'APPROVED' || doctor.user?.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: 'DOCTOR_NOT_VERIFIED',
        message: 'Access request requires an approved, accredited doctor account in ACTIVE status.',
      });
      return;
    }

    let durationDays = 3;
    let expiresAt: Date | undefined = undefined;

    const normDuration = String(requestedDuration || '').toLowerCase().trim();
    if (normDuration.includes('1h') || normDuration.includes('1_hour') || normDuration === '1 hour') {
      expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
      durationDays = 1;
    } else if (normDuration.includes('2h') || normDuration.includes('2_hours') || normDuration === '2 hours') {
      expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
      durationDays = 1;
    } else if (normDuration.includes('3h') || normDuration.includes('3_hours') || normDuration === '3 hours') {
      expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
      durationDays = 1;
    } else if (normDuration.includes('6h') || normDuration.includes('6_hours') || normDuration === '6 hours') {
      expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
      durationDays = 1;
    } else if (normDuration.includes('12h') || normDuration.includes('12_hours') || normDuration === '12 hours') {
      expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
      durationDays = 1;
    } else if (normDuration.includes('1d') || normDuration.includes('24_hours') || normDuration.includes('1 day') || normDuration.includes('1_day')) {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      durationDays = 1;
    } else if (normDuration.includes('2d') || normDuration.includes('2 days') || normDuration.includes('2_days')) {
      expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      durationDays = 2;
    } else if (normDuration.includes('3d') || normDuration.includes('3 days') || normDuration.includes('3_days')) {
      expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      durationDays = 3;
    } else if (normDuration.includes('7d') || normDuration.includes('7 days') || normDuration.includes('7_days')) {
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      durationDays = 7;
    } else if (normDuration.includes('30d') || normDuration.includes('30 days') || normDuration.includes('30_days')) {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      durationDays = 30;
    } else {
      expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      durationDays = 3;
    }

    // Clean and validate scopes
    const rawScopes = Array.isArray(scopes) ? scopes : [scopes];
    const cleanedScopes = rawScopes
      .map((s: any) => String(s).trim())
      .filter((s: string) => s && s.toLowerCase() !== 'nothing' && s.toLowerCase() !== 'none');
    const finalScopes = cleanedScopes.length > 0 ? cleanedScopes : ['Consultations', 'Prescriptions', 'Lab Reports'];

    const resolvedReason = reason && typeof reason === 'string' && reason.trim() && reason.trim().toLowerCase() !== 'nothing'
      ? reason.trim()
      : 'Clinical Consultation & EMR Review';

    const accessRequest = await prisma.accessRequest.create({
      data: {
        patientId: patient.id,
        doctorId: doctorId!,
        hospitalId: doctor.hospitalAffiliation ? undefined : undefined,
        reason: resolvedReason,
        scopeJson: JSON.stringify(finalScopes),
        requestedDuration: requestedDuration || '3 Days',
        durationDays,
        expiresAt,
        status: 'PENDING',
      },
      include: { doctor: true },
    });

    // Send in-app notification to patient
    await prisma.notification.create({
      data: {
        userId: patient.userId,
        title: 'New Doctor Access Request',
        message: `Dr. ${doctor.fullName} (${doctor.registrationNumber}) from ${doctor.hospitalAffiliation || 'Apex Health Care'} requested access to your medical records (${finalScopes.join(', ')} for ${requestedDuration || '3 Days'}). Reason: "${resolvedReason}".`,
        type: 'ACCESS_REQUEST',
        category: 'ACCESS_REQUEST',
        priority: 'HIGH',
        linkRoute: `/patient/access-permissions?requestId=${accessRequest.id}`,
        isRead: false,
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'DOCTOR',
      actorName: req.user!.fullName || doctor.fullName,
      patientId: patient.id,
      patientHealthId: patient.healthId,
      doctorId,
      doctorName: doctor.fullName,
      documentId: accessRequest.id,
      documentType: 'ACCESS_PERMISSION',
      action: 'CREATE',
      accessType: 'NORMAL',
      reason: `Requested ${durationDays}-day EMR access [${finalScopes.join(', ')}]: ${resolvedReason}`,
      authorizationStatus: 'AUTHORIZED',
      ipAddress: req.ip as string,
    });

    res.status(201).json({
      success: true,
      message: 'Access request sent to patient. You will be notified upon approval.',
      accessRequest,
    });
  }

  /**
   * List access requests submitted by this doctor.
   */
  async listAccessRequests(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;

    const requests = await prisma.accessRequest.findMany({
      where: { doctorId },
      include: { patient: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, requests });
  }

  /**
   * Ping / remind patient regarding an existing pending access request.
   * Persists real notification in database and logs audit event.
   */
  async pingPatient(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;
    const id = (req.params.id || req.body?.requestId || req.body?.id) as string;

    if (!doctorId) {
      res.status(403).json({ success: false, error: 'DOCTOR_PROFILE_REQUIRED' });
      return;
    }

    if (!id) {
      res.status(400).json({ success: false, error: 'Access Request ID is required.' });
      return;
    }

    const accessRequest = await prisma.accessRequest.findFirst({
      where: {
        id,
        doctorId,
      },
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctor: true,
      },
    });

    if (!accessRequest) {
      res.status(404).json({ success: false, error: 'Access request not found or unauthorized.' });
      return;
    }

    if (accessRequest.status !== 'PENDING') {
      res.status(400).json({
        success: false,
        error: 'REQUEST_NOT_PENDING',
        message: `Cannot send reminder for an access request with status ${accessRequest.status}.`,
      });
      return;
    }

    const doctorName = accessRequest.doctor.fullName || req.user?.fullName || 'Dr. Practitioner';

    // Persist real reminder notification in database
    await prisma.notification.create({
      data: {
        userId: accessRequest.patient.userId,
        title: 'Consent Reminder: EMR Access Request',
        message: `Dr. ${doctorName} is awaiting your response to their EMR access request (${accessRequest.reason}). Please review and grant or deny access.`,
        type: 'ACCESS_REQUEST',
        category: 'ACCESS_REQUEST',
        priority: 'HIGH',
        linkRoute: `/patient/access-permissions?requestId=${accessRequest.id}`,
        metadataJson: JSON.stringify({
          requestId: accessRequest.id,
          doctorId: accessRequest.doctorId,
          doctorName,
          healthId: accessRequest.patient.healthId,
          reason: accessRequest.reason,
          duration: accessRequest.requestedDuration,
        }),
        isRead: false,
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'DOCTOR',
      actorName: req.user!.fullName || accessRequest.doctor.fullName,
      patientId: accessRequest.patientId,
      patientHealthId: accessRequest.patient.healthId,
      doctorId,
      doctorName: accessRequest.doctor.fullName,
      documentId: accessRequest.id,
      documentType: 'ACCESS_PERMISSION',
      action: 'MODIFY',
      accessType: 'NORMAL',
      reason: `Sent access request review reminder to patient ${accessRequest.patient.healthId}`,
      authorizationStatus: 'AUTHORIZED',
      ipAddress: req.ip as string,
    });

    res.json({
      success: true,
      message: `Reminder notification sent to patient ${accessRequest.patient.fullName}.`,
    });
  }

  /**
   * Get authorized patient EMR records.
   * STRICTLY enforces active permission or active emergency session!
   * Returns ONLY records permitted by approved scopes.
   * LOGS INDIVIDUAL GRANULAR AUDIT EVENTS FOR EVERY VIEW!
   */
  async getAuthorizedEMR(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;
    const targetParam = req.params.patientId as string;

    if (!doctorId) {
      res.status(403).json({ success: false, error: 'Doctor ID required' });
      return;
    }

    const patientRecord = await prisma.patient.findFirst({
      where: {
        OR: [
          { id: targetParam },
          { healthId: { equals: targetParam, mode: 'insensitive' } },
        ],
      },
    });

    if (!patientRecord) {
      res.status(404).json({ success: false, error: 'PATIENT_NOT_FOUND', message: 'Patient not found' });
      return;
    }

    // Check emergency session
    const activeEmergency = await prisma.emergencySession.findFirst({
      where: {
        patientId: patientRecord.id,
        doctorId,
        status: 'ACTIVE',
        autoExpiryTime: { gt: new Date() },
      },
    });

    // Check regular active permission
    const activePermission = await prisma.permission.findFirst({
      where: {
        patientId: patientRecord.id,
        doctorId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (!activeEmergency && !activePermission) {
      res.status(403).json({
        success: false,
        error: 'ACCESS_UNAUTHORIZED',
        message: 'You do not have active consent permission or an emergency session for this patient.',
      });
      return;
    }

    let allowedScopes: string[] = [];
    if (activeEmergency) {
      allowedScopes = ['CRITICAL_INFO', 'ALLERGIES', 'MEDICINES', 'PRESCRIPTIONS', 'CONDITIONS', 'LAB_REPORTS'];
    } else if (activePermission) {
      try {
        allowedScopes = JSON.parse(activePermission.scopeJson);
      } catch {
        allowedScopes = ['CONSULTATIONS', 'PRESCRIPTIONS', 'LAB_REPORTS'];
      }
    }

    const upperScopes = allowedScopes.map(s => String(s).toUpperCase().replace(/[\s-]+/g, '_'));
    const isScopeAllowed = (scopeName: string) => {
      if (upperScopes.some(s => s === 'ALL' || s === 'ALL_CLINICAL_SCOPES' || s === 'ALL_SCOPES' || s === 'CRITICAL_INFO')) return true;
      if (scopeName === 'LAB_REPORTS') {
        return upperScopes.some(s => s === 'LAB_REPORTS' || s === 'LAB_REPORT' || s === 'REPORTS' || s === 'REPORT' || s === 'LABS');
      }
      if (scopeName === 'PRESCRIPTIONS') {
        return upperScopes.some(s => s === 'PRESCRIPTIONS' || s === 'PRESCRIPTION' || s === 'MEDICINES' || s === 'MEDICATIONS');
      }
      if (scopeName === 'CONSULTATIONS') {
        return upperScopes.some(s => s === 'CONSULTATIONS' || s === 'CONSULTATION' || s === 'MEDICAL_HISTORY' || s === 'HISTORY');
      }
      if (scopeName === 'ALLERGIES') {
        return upperScopes.some(s => s === 'ALLERGIES' || s === 'ALLERGY' || s === 'BASIC_PROFILE' || s === 'MEDICAL_HISTORY');
      }
      if (scopeName === 'MEDICINES') {
        return upperScopes.some(s => s === 'MEDICINES' || s === 'MEDICATION' || s === 'MEDICATIONS' || s === 'PRESCRIPTIONS');
      }
      if (scopeName === 'CONDITIONS') {
        return upperScopes.some(s => s === 'CONDITIONS' || s === 'CONDITION' || s === 'MEDICAL_HISTORY');
      }
      return upperScopes.includes(scopeName);
    };

    const patient = await prisma.patient.findUnique({
      where: { id: patientRecord.id },
      include: {
        healthProfile: true,
        allergies: isScopeAllowed('ALLERGIES'),
        medications: isScopeAllowed('MEDICINES'),
        conditions: isScopeAllowed('CONDITIONS'),
        prescriptions: isScopeAllowed('PRESCRIPTIONS')
          ? { include: { medicines: true }, orderBy: { createdAt: 'desc' } }
          : false,
        labReports: isScopeAllowed('LAB_REPORTS')
          ? { include: { doctor: true, hospital: true }, orderBy: { createdAt: 'desc' } }
          : false,
        consultations: isScopeAllowed('CONSULTATIONS')
          ? { include: { doctor: true }, orderBy: { date: 'desc' } }
          : false,
      },
    });

    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient not found' });
      return;
    }

    // Log granular AuditEvent for EMR access
    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'DOCTOR',
      actorName: req.user!.fullName || 'Doctor',
      patientId: patient.id,
      patientHealthId: patient.healthId,
      doctorId,
      doctorName: req.user!.fullName,
      documentType: 'CONSULTATION',
      accessType: activeEmergency ? 'EMERGENCY' : 'CONSENT_GRANTED',
      action: 'VIEW',
    });

    // Apply Document Privacy access control rules
    const filteredPrescriptions = Array.isArray(patient.prescriptions)
      ? patient.prescriptions.filter((p) => {
          const isPrivate = p.notes?.includes('VISIBILITY:PRIVATE');
          const isEmergencyBlocked = p.notes?.includes('EMERGENCY:BLOCKED');
          if (activeEmergency) return !isEmergencyBlocked;
          return !isPrivate;
        })
      : patient.prescriptions;

    const filteredLabReports = Array.isArray(patient.labReports)
      ? patient.labReports.filter((l) => {
          const isPrivate = l.summary?.includes('VISIBILITY:PRIVATE');
          const isEmergencyBlocked = l.summary?.includes('EMERGENCY:BLOCKED');
          if (activeEmergency) return !isEmergencyBlocked;
          return !isPrivate;
        })
      : patient.labReports;

    const filteredConsultations = Array.isArray(patient.consultations)
      ? patient.consultations.filter((c) => {
          const isPrivate = c.clinicalNotes?.includes('VISIBILITY:PRIVATE');
          const isEmergencyBlocked = c.clinicalNotes?.includes('EMERGENCY:BLOCKED');
          if (activeEmergency) return !isEmergencyBlocked;
          return !isPrivate;
        })
      : patient.consultations;

    const sanitizedPatient = {
      ...patient,
      prescriptions: filteredPrescriptions,
      labReports: filteredLabReports,
      consultations: filteredConsultations,
    };

    res.json({
      success: true,
      accessMode: activeEmergency ? 'EMERGENCY_OVERRIDE' : 'AUTHORIZED_CONSENT',
      activePermission,
      activeEmergencySession: activeEmergency,
      allowedScopes,
      patient: sanitizedPatient,
    });
  }

  /**
   * Conduct consultation & save clinical findings with SHA-256 hash & blockchain proof.
   */
  async createConsultation(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;
    const {
      patientId,
      appointmentId,
      consultationType = 'IN_PERSON',
      symptoms,
      observations,
      vitals,
      diagnosis,
      treatmentPlan,
      clinicalNotes,
      followUpDate,
      medicines,
      medications,
      recommendedLabTests,
    } = req.body;

    const resolvedSymptoms = symptoms || req.body.chiefComplaint || clinicalNotes || observations || 'Consultation findings';
    const resolvedDiagnosis = diagnosis || 'General Medical Consultation';
    const resolvedTreatmentPlan = treatmentPlan || req.body.plan || clinicalNotes || 'Standard medical management';

    if (!patientId || !resolvedSymptoms || !resolvedDiagnosis || !resolvedTreatmentPlan) {
      res.status(400).json({ success: false, error: 'Missing required clinical consultation fields.' });
      return;
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient not found.' });
      return;
    }

    // Verify Active Permission or Active Emergency Session
    const activeEmergency = await prisma.emergencySession.findFirst({
      where: {
        patientId,
        doctorId,
        status: 'ACTIVE',
        autoExpiryTime: { gt: new Date() },
      },
    });

    const activePermission = await prisma.permission.findFirst({
      where: {
        patientId,
        doctorId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (!activeEmergency && !activePermission) {
      res.status(403).json({
        success: false,
        error: 'ACCESS_UNAUTHORIZED',
        message: 'Active patient consent permission or emergency override required to record consultation.',
      });
      return;
    }

    const count = await prisma.consultation.count();
    const consultationNumber = `CON-${8902 + count}`;

    const canonicalData = {
      consultationNumber,
      patientHealthId: patient.healthId,
      doctorReg: req.user?.doctorRegNumber,
      date: new Date().toISOString().split('T')[0],
      vitals,
      diagnosis: resolvedDiagnosis,
      treatmentPlan: resolvedTreatmentPlan,
    };
    const hash = calculateCanonicalSha256(canonicalData);

    // Register Blockchain Proof
    const proof = await blockchainService.registerRecordProof({
      recordId: consultationNumber,
      recordType: 'CONSULTATION',
      eventType: 'RECORD_CREATED',
      payload: canonicalData,
      referenceId: patient.healthId,
    });

    const consultation = await prisma.consultation.create({
      data: {
        consultationNumber,
        appointmentId: appointmentId || null,
        patientId,
        doctorId: doctorId!,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        consultationType,
        symptoms: resolvedSymptoms,
        observations: observations || 'General clinical assessment completed.',
        vitalsJson: vitals ? JSON.stringify(vitals) : null,
        diagnosis: resolvedDiagnosis,
        treatmentPlan: resolvedTreatmentPlan,
        clinicalNotes: clinicalNotes || req.body.notes || null,
        followUpDate,
        status: 'COMPLETED',
        recordHash: hash,
        blockchainTxId: proof.transactionId,
        blockchainStatus: 'VERIFIED',
      },
    });

    // Update appointment status if applicable
    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' },
      });
    }

    // Handle Linked Prescription & Medicines if provided
    const medicineList = (Array.isArray(medicines) && medicines.length > 0 ? medicines : Array.isArray(medications) && medications.length > 0 ? medications : []).filter((m: any) => m && (m.name || m.medicineName));
    let createdPrescription: any = null;

    if (medicineList.length > 0) {
      const rxCount = await prisma.prescription.count();
      const prescriptionNumber = `RX-${100246 + rxCount}`;
      const rxCanonicalData = {
        prescriptionNumber,
        patientHealthId: patient.healthId,
        doctorReg: req.user?.doctorRegNumber,
        date: new Date().toISOString().split('T')[0],
        diagnosis: resolvedDiagnosis,
        medicines: medicineList.map((m: any) => ({
          name: m.medicineName || m.name || 'Prescribed Medicine',
          dosage: m.dosage || '1 tablet',
          frequency: m.frequency || 'Once daily',
          duration: m.duration || '5 days',
        })),
      };
      const rxHash = calculateCanonicalSha256(rxCanonicalData);
      const rxProof = await blockchainService.registerRecordProof({
        recordId: prescriptionNumber,
        recordType: 'PRESCRIPTION',
        eventType: 'RECORD_CREATED',
        payload: rxCanonicalData,
        referenceId: patient.healthId,
      });

      createdPrescription = await prisma.prescription.create({
        data: {
          prescriptionNumber,
          patientId,
          doctorId: doctorId!,
          consultationId: consultation.id,
          diagnosis: resolvedDiagnosis,
          notes: clinicalNotes || `Prescribed during consultation ${consultationNumber}`,
          recordHash: rxHash,
          blockchainTxId: rxProof.transactionId,
          blockchainStatus: 'VERIFIED',
          medicines: {
            create: medicineList.map((m: any) => ({
              medicineName: m.medicineName || m.name || 'Prescribed Medicine',
              dosage: m.dosage || '1 tablet',
              frequency: m.frequency || 'Once daily',
              timingMorning: !!m.timingMorning || (typeof m.frequency === 'string' && m.frequency.includes('1-')),
              timingAfternoon: !!m.timingAfternoon,
              timingEvening: !!m.timingEvening,
              timingNight: !!m.timingNight || (typeof m.timing === 'string' && m.timing.toLowerCase().includes('night')) || (typeof m.frequency === 'string' && m.frequency.endsWith('-1')),
              duration: m.duration || '5 days',
              instructions: m.instructions || m.foodInstructions || null,
            })),
          },
        },
        include: { medicines: true },
      });

      for (const med of medicineList) {
        await prisma.medication.create({
          data: {
            patientId,
            medicineName: med.medicineName || med.name || 'Prescribed Medicine',
            dosage: med.dosage || '1 tablet',
            frequency: med.frequency || 'Once daily',
            timingSlot: med.timingMorning ? 'MORNING' : (med.timingNight || (typeof med.timing === 'string' && med.timing.toLowerCase().includes('night'))) ? 'NIGHT' : 'AFTERNOON',
            duration: med.duration || '5 days',
            instructions: med.instructions || med.foodInstructions || null,
            startDate: new Date().toISOString().split('T')[0],
            status: 'ACTIVE',
            prescriptionId: createdPrescription.id,
          },
        });
      }

      await logAuditEvent({
        actorId: req.user!.id,
        actorRole: 'DOCTOR',
        actorName: req.user!.fullName || 'Doctor',
        patientId,
        patientHealthId: patient.healthId,
        doctorId,
        doctorName: req.user!.fullName,
        documentId: createdPrescription.id,
        documentType: 'PRESCRIPTION',
        action: 'CREATE',
        accessType: 'NORMAL',
        reason: `Generated e-prescription ${prescriptionNumber} with ${medicineList.length} medicine(s)`,
        blockchainTxId: rxProof.transactionId,
        blockchainVerificationStatus: 'VERIFIED',
        ipAddress: req.ip,
      });

      if (patient.userId) {
        await prisma.notification.create({
          data: {
            userId: patient.userId,
            title: 'New Prescription Issued',
            message: `Dr. ${req.user?.fullName || 'Doctor'} prescribed ${medicineList.length} medication(s) with blockchain verification.`,
            type: 'PRESCRIPTION',
            category: 'PRESCRIPTION',
            priority: 'NORMAL',
            linkRoute: `/patient/prescriptions/${createdPrescription.id}`,
            metadataJson: JSON.stringify({
              prescriptionId: createdPrescription.id,
              prescriptionNumber: createdPrescription.prescriptionNumber,
              doctorId: doctorId,
              doctorName: req.user?.fullName || 'Doctor',
            }),
          },
        });
      }
    }

    // Handle Recommended Lab Tests if provided
    if (recommendedLabTests && typeof recommendedLabTests === 'string' && recommendedLabTests.trim()) {
      const lrCount = await prisma.labReport.count();
      const reportNumber = `LR-${2033 + lrCount}`;
      await prisma.labReport.create({
        data: {
          reportNumber,
          patientId,
          doctorId: doctorId!,
          testName: recommendedLabTests.trim(),
          category: 'Pathology & Diagnostics',
          laboratoryName: 'Apex Diagnostic Services',
          sampleDate: new Date().toISOString().split('T')[0],
          resultDate: new Date().toISOString().split('T')[0],
          status: 'ORDERED',
          summary: `Diagnostic tests recommended during consultation ${consultationNumber}: ${recommendedLabTests.trim()}`,
          findingsJson: JSON.stringify({ observation: 'Order placed by physician. Awaiting sample collection and laboratory analysis.' }),
          canonicalDataJson: JSON.stringify({ reportNumber, patientHealthId: patient.healthId, testName: recommendedLabTests.trim() }),
          recordHash: calculateCanonicalSha256({ reportNumber, patientHealthId: patient.healthId, testName: recommendedLabTests }),
        },
      });


      if (patient.userId) {
        await prisma.notification.create({
          data: {
            userId: patient.userId,
            title: 'New Diagnostic Order',
            message: `Dr. ${req.user?.fullName || 'Doctor'} requested diagnostic test: ${recommendedLabTests.trim()}.`,
            type: 'LAB_REPORT',
            category: 'LAB_REPORT',
            priority: 'NORMAL',
            linkRoute: '/patient/lab-reports',
          },
        });
      }
    }

    // Log granular AuditEvent for Consultation
    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'DOCTOR',
      actorName: req.user!.fullName || 'Doctor',
      patientId,
      patientHealthId: patient.healthId,
      doctorId,
      doctorName: req.user!.fullName,
      documentId: consultation.id,
      documentType: 'CONSULTATION',
      action: 'CREATE',
      accessType: 'NORMAL',
      reason: `Completed consultation ${consultationNumber}: ${diagnosis}`,
      blockchainTxId: proof.transactionId,
      blockchainVerificationStatus: 'VERIFIED',
      ipAddress: req.ip,
    });

    // Notify patient
    if (patient.userId) {
      await prisma.notification.create({
        data: {
          userId: patient.userId,
          title: 'New Consultation Available',
          message: `Dr. ${req.user?.fullName || 'Doctor'} added a new consultation (${consultationNumber}: ${diagnosis}) to your medical record.`,
          type: 'CONSULTATION',
          category: 'CONSULTATION',
          priority: 'NORMAL',
          linkRoute: '/patient/consultations',
        },
      });
    }


    res.status(201).json({
      success: true,
      message: 'Consultation conducted and registered with cryptographic blockchain proof.',
      consultation,
      prescription: createdPrescription,
      blockchainProof: proof,
    });
  }

  /**
   * Update clinical consultation findings while permission is ACTIVE.
   */
  async updateConsultation(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;
    const id = req.params.id as string;
    const { symptoms, observations, vitals, diagnosis, treatmentPlan, clinicalNotes, followUpDate } = req.body;

    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: { patient: true },
    });

    if (!consultation || consultation.doctorId !== doctorId) {
      res.status(404).json({ success: false, error: 'Consultation not found or not owned by doctor.' });
      return;
    }

    // Check active permission or emergency session
    const activeEmergency = await prisma.emergencySession.findFirst({
      where: {
        patientId: consultation.patientId,
        doctorId,
        status: 'ACTIVE',
        autoExpiryTime: { gt: new Date() },
      },
    });

    const activePermission = await prisma.permission.findFirst({
      where: {
        patientId: consultation.patientId,
        doctorId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (!activeEmergency && !activePermission) {
      res.status(403).json({
        success: false,
        error: 'ACCESS_EXPIRED_OR_REVOKED',
        message: 'Cannot edit consultation: EMR access permission has expired or been revoked by the patient.',
      });
      return;
    }

    const updated = await prisma.consultation.update({
      where: { id },
      data: {
        symptoms: symptoms || consultation.symptoms,
        observations: observations || consultation.observations,
        vitalsJson: vitals ? JSON.stringify(vitals) : consultation.vitalsJson,
        diagnosis: diagnosis || consultation.diagnosis,
        treatmentPlan: treatmentPlan || consultation.treatmentPlan,
        clinicalNotes: clinicalNotes !== undefined ? clinicalNotes : consultation.clinicalNotes,
        followUpDate: followUpDate !== undefined ? followUpDate : consultation.followUpDate,
      },
    });

    // Log granular AuditEvent
    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'DOCTOR',
      actorName: req.user!.fullName || 'Doctor',
      patientId: consultation.patientId,
      patientHealthId: consultation.patient?.healthId,
      doctorId,
      doctorName: req.user!.fullName,
      documentId: consultation.id,
      documentType: 'CONSULTATION',
      action: 'MODIFY',
      accessType: 'NORMAL',
      reason: `Updated clinical findings for consultation ${consultation.consultationNumber}`,
      authorizationStatus: 'AUTHORIZED',
      ipAddress: req.ip,
    });

    // Notify patient
    if (consultation.patient?.userId) {
      await prisma.notification.create({
        data: {
          userId: consultation.patient.userId,
          title: 'Consultation Note Updated',
          message: `Dr. ${req.user?.fullName || 'Doctor'} updated clinical notes for consultation ${consultation.consultationNumber}.`,
          type: 'RECORD',
          category: 'CONSULTATION',
          priority: 'NORMAL',
          linkRoute: '/patient/consultations',
        },
      });
    }

    res.json({
      success: true,
      message: 'Consultation updated successfully.',
      consultation: updated,
    });
  }

  /**
   * Create prescription with medicines, calculate canonical SHA-256 hash, and register on blockchain.
   */
  async createPrescription(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;
    const { patientId, consultationId, diagnosis, notes, medicines } = req.body;

    if (!patientId || !diagnosis || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
      res.status(400).json({ success: false, error: 'Patient, diagnosis, and at least one medication are required.' });
      return;
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient not found' });
      return;
    }

    // Verify Active Permission or Active Emergency Session
    const activeEmergency = await prisma.emergencySession.findFirst({
      where: {
        patientId,
        doctorId,
        status: 'ACTIVE',
        autoExpiryTime: { gt: new Date() },
      },
    });

    const activePermission = await prisma.permission.findFirst({
      where: {
        patientId,
        doctorId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (!activeEmergency && !activePermission) {
      res.status(403).json({
        success: false,
        error: 'ACCESS_UNAUTHORIZED',
        message: 'Active patient consent permission or emergency override required to issue prescription.',
      });
      return;
    }

    const count = await prisma.prescription.count();
    const prescriptionNumber = `RX-${100246 + count}`;

    const canonicalData = {
      prescriptionNumber,
      patientHealthId: patient.healthId,
      doctorReg: req.user?.doctorRegNumber,
      date: new Date().toISOString().split('T')[0],
      diagnosis,
      medicines: medicines.map((m: any) => ({
        name: m.medicineName || m.name || 'Prescribed Medicine',
        dosage: m.dosage || '1 tablet',
        frequency: m.frequency || 'Once daily',
        duration: m.duration || '5 days',
      })),
    };
    const hash = calculateCanonicalSha256(canonicalData);

    // Register Blockchain Proof
    const proof = await blockchainService.registerRecordProof({
      recordId: prescriptionNumber,
      recordType: 'PRESCRIPTION',
      eventType: 'RECORD_CREATED',
      payload: canonicalData,
      referenceId: patient.healthId,
    });

    const prescription = await prisma.prescription.create({
      data: {
        prescriptionNumber,
        patientId,
        doctorId: doctorId!,
        consultationId: consultationId || null,
        diagnosis,
        notes,
        recordHash: hash,
        blockchainTxId: proof.transactionId,
        blockchainStatus: 'VERIFIED',
        medicines: {
          create: medicines.map((m: any) => ({
            medicineName: m.medicineName || m.name || 'Prescribed Medicine',
            dosage: m.dosage || '1 tablet',
            frequency: m.frequency || 'Once daily',
            timingMorning: !!m.timingMorning,
            timingAfternoon: !!m.timingAfternoon,
            timingEvening: !!m.timingEvening,
            timingNight: !!m.timingNight || (typeof m.timing === 'string' && m.timing.toLowerCase().includes('night')),
            duration: m.duration || '5 days',
            instructions: m.instructions || m.foodInstructions || null,
          })),
        },
      },
      include: { medicines: true },
    });

    // Also add to patient's active Medication tracking
    for (const med of medicines) {
      await prisma.medication.create({
        data: {
          patientId,
          medicineName: med.medicineName || med.name || 'Prescribed Medicine',
          dosage: med.dosage || '1 tablet',
          frequency: med.frequency || 'Once daily',
          timingSlot: med.timingMorning ? 'MORNING' : (med.timingNight || (typeof med.timing === 'string' && med.timing.toLowerCase().includes('night'))) ? 'NIGHT' : 'AFTERNOON',
          duration: med.duration || '5 days',
          instructions: med.instructions || med.foodInstructions || null,
          startDate: new Date().toISOString().split('T')[0],
          status: 'ACTIVE',
          prescriptionId: prescription.id,
        },
      });
    }

    // Log granular AuditEvent
    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'DOCTOR',
      actorName: req.user!.fullName || 'Doctor',
      patientId,
      patientHealthId: patient.healthId,
      doctorId,
      doctorName: req.user!.fullName,
      documentId: prescription.id,
      documentType: 'PRESCRIPTION',
      action: 'CREATE',
      accessType: 'NORMAL',
      reason: `Generated e-prescription ${prescriptionNumber} with ${medicines.length} medicines`,
      blockchainTxId: proof.transactionId,
      blockchainVerificationStatus: 'VERIFIED',
      ipAddress: req.ip,
    });

    // Notify patient
    await prisma.notification.create({
      data: {
        userId: patient.userId,
        title: 'New Prescription Issued',
        message: `${req.user?.fullName || 'Doctor'} prescribed ${medicines.length} medication(s) with blockchain verification.`,
        type: 'PRESCRIPTION',
        category: 'PRESCRIPTION',
        priority: 'NORMAL',
        linkRoute: `/patient/prescriptions/${prescription.id}`,
        metadataJson: JSON.stringify({
          prescriptionId: prescription.id,
          prescriptionNumber: prescription.prescriptionNumber,
          doctorId: doctorId,
          doctorName: req.user?.fullName || 'Doctor',
        }),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Prescription created and sealed with blockchain proof.',
      prescription,
      blockchainProof: proof,
    });
  }

  /**
   * Upload / create lab report with blockchain proof.
   */
  async createLabReport(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;
    const { patientId, testName, category = 'Pathology', laboratoryName, sampleDate, resultDate, summary, findings } = req.body;

    const resolvedLabName = laboratoryName || req.body.labName || 'Apollo Diagnostics';

    if (!patientId || !testName || !resolvedLabName || !summary) {
      res.status(400).json({ success: false, error: 'Patient, test name, laboratory, and summary are required.' });
      return;
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient not found.' });
      return;
    }

    // Verify Active Permission or Active Emergency Session
    const activeEmergency = await prisma.emergencySession.findFirst({
      where: {
        patientId,
        doctorId,
        status: 'ACTIVE',
        autoExpiryTime: { gt: new Date() },
      },
    });

    const activePermission = await prisma.permission.findFirst({
      where: {
        patientId,
        doctorId,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (!activeEmergency && !activePermission) {
      res.status(403).json({
        success: false,
        error: 'ACCESS_UNAUTHORIZED',
        message: 'Active patient consent permission or emergency override required to record lab report.',
      });
      return;
    }

    const count = await prisma.labReport.count();
    const reportNumber = `LR-${2033 + count}`;

    const canonicalData = {
      reportNumber,
      patientHealthId: patient.healthId,
      testName,
      laboratoryName: resolvedLabName,
      date: resultDate || new Date().toISOString().split('T')[0],
      findings: findings || summary,
    };
    const hash = calculateCanonicalSha256(canonicalData);

    // Register Blockchain Proof
    const proof = await blockchainService.registerRecordProof({
      recordId: reportNumber,
      recordType: 'LAB_REPORT',
      eventType: 'RECORD_CREATED',
      payload: canonicalData,
      referenceId: patient.healthId,
    });

    const report = await prisma.labReport.create({
      data: {
        reportNumber,
        patientId,
        doctorId,
        testName,
        category,
        sampleDate: sampleDate || new Date().toISOString().split('T')[0],
        resultDate: resultDate || new Date().toISOString().split('T')[0],
        laboratoryName: resolvedLabName,
        summary,
        findingsJson: findings ? JSON.stringify(findings) : JSON.stringify({ summary }),
        status: 'COMPLETED',
        canonicalDataJson: JSON.stringify(canonicalData),
        recordHash: hash,
        blockchainTxId: proof.transactionId,
        blockchainStatus: 'VERIFIED',
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'DOCTOR',
      actorName: req.user!.fullName || 'Doctor',
      patientId,
      patientHealthId: patient.healthId,
      doctorId,
      documentId: report.id,
      documentType: 'LAB_REPORT',
      action: 'CREATE',
      accessType: 'NORMAL',
      reason: `Uploaded laboratory report ${reportNumber} (${testName})`,
      blockchainTxId: proof.transactionId,
      blockchainVerificationStatus: 'VERIFIED',
      ipAddress: req.ip,
    });

    // Notify patient
    if (patient.userId) {
      await prisma.notification.create({
        data: {
          userId: patient.userId,
          title: 'New Laboratory Report Ready',
          message: `Diagnostic report ${reportNumber} (${testName}) has been published.`,
          type: 'LAB',
          category: 'LAB_REPORT',
          priority: 'NORMAL',
          linkRoute: '/patient/lab-reports',
        },
      });
    }

    res.status(201).json({ success: true, message: 'Lab report uploaded with blockchain proof.', report, blockchainProof: proof });
  }

  /**
   * Initiate Emergency Access Session.
   * Doctor searches patient -> enters reason -> gains immediate limited critical EMR access.
   * NO patient approval required. Triggers high-priority notifications & audit logging!
   */
  async initiateEmergencyAccess(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;
    const { healthId, reason, condition, incident, currentCondition, confirmation, confirmed, hospitalId } = req.body;

    if (!doctorId) {
      res.status(403).json({ success: false, error: 'DOCTOR_REQUIRED', message: 'Doctor authentication required.' });
      return;
    }

    // Verify doctor status in database (Requirement 33)
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { user: true },
    });

    if (!doctor || doctor.regStatus !== 'APPROVED' || doctor.user?.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: 'DOCTOR_NOT_VERIFIED',
        message: 'Emergency access requires an approved, accredited doctor account in ACTIVE status.',
      });
      return;
    }

    const resolvedCondition = condition || currentCondition || incident || '';
    const isConfirmed = confirmation === true || confirmed === true || confirmation === 'true' || confirmed === 'true';

    if (!healthId || !reason || !reason.trim() || !resolvedCondition.trim() || !isConfirmed) {
      res.status(400).json({
        success: false,
        error: 'EMERGENCY_FIELDS_REQUIRED',
        message: 'Patient Health ID, emergency reason, current condition/incident, and explicit confirmation are all mandatory for emergency access.',
      });
      return;
    }

    const patient = await prisma.patient.findUnique({
      where: { healthId },
      include: {
        user: true,
        emergencyContacts: true,
        healthProfile: true,
        allergies: true,
        medications: { where: { status: 'ACTIVE' } },
        conditions: { where: { status: 'ACTIVE' } },
        prescriptions: { take: 3, orderBy: { createdAt: 'desc' }, include: { medicines: true } },
      },
    });

    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient with this Health ID not found.' });
      return;
    }

    const count = await prisma.emergencySession.count();
    const sessionNumber = `EMG-${7802 + count}`;
    const autoExpiryTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // EXACTLY 2-hour automatic safety expiry strictly

    let targetHospitalId = hospitalId;
    if (!targetHospitalId) {
      const defaultHospital = await prisma.hospital.findFirst();
      targetHospitalId = defaultHospital?.id;
    }

    const fullReason = `Reason: ${reason.trim()} | Condition: ${resolvedCondition.trim()}`;

    const emergencySession = await prisma.emergencySession.create({
      data: {
        sessionNumber,
        patientId: patient.id,
        doctorId: doctorId!,
        hospitalId: targetHospitalId!,
        reason: fullReason,
        doctorVerified: true,
        hospitalVerified: true,
        startTime: new Date(),
        autoExpiryTime,
        status: 'ACTIVE',
      },
    });

    // Register Blockchain Event Proof
    const proof = await blockchainService.registerRecordProof({
      recordId: sessionNumber,
      recordType: 'EMERGENCY_NOTE',
      eventType: 'EMERGENCY_ACCESS',
      payload: {
        sessionNumber,
        patientHealthId: patient.healthId,
        doctorId,
        doctorName: req.user?.fullName,
        reason,
        timestamp: new Date().toISOString(),
      },
      referenceId: patient.healthId,
    });

    // 1. Log High-Severity Audit Event
    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'DOCTOR',
      actorName: req.user!.fullName || 'Doctor',
      patientId: patient.id,
      patientHealthId: patient.healthId,
      doctorId,
      doctorName: req.user!.fullName,
      documentId: emergencySession.id,
      documentType: 'EMERGENCY_NOTE',
      action: 'EMERGENCY_ACCESS',
      accessType: 'EMERGENCY',
      reason: `Emergency EMR Bypass initiated: ${reason}`,
      authorizationStatus: 'EMERGENCY_OVERRIDE',
      consentStatus: 'EMERGENCY_BYPASS',
      sessionId: sessionNumber,
      blockchainTxId: proof.transactionId,
      blockchainVerificationStatus: 'VERIFIED',
      result: 'SUCCESS',
      severity: 'HIGH',
      ipAddress: req.ip,
    });

    // 2. Notify Patient immediately
    await prisma.notification.create({
      data: {
        userId: patient.userId,
        title: '🚨 Emergency Record Access Initiated',
        message: `Dr. ${req.user?.fullName} initiated emergency bypass access for reason: "${reason}". Session: ${sessionNumber}.`,
        type: 'EMERGENCY',
        priority: 'CRITICAL',
        linkRoute: `/patient/emergency/${emergencySession.id}`,
      },
    });

    // 3. Notify Registered Emergency Contacts if they have patient accounts
    for (const contact of patient.emergencyContacts) {
      if (contact.isRegisteredPatient && contact.registeredPatientId) {
        const contactPatient = await prisma.patient.findUnique({
          where: { id: contact.registeredPatientId },
        });
        if (contactPatient) {
          await prisma.notification.create({
            data: {
              userId: contactPatient.userId,
              title: `🚨 Emergency Alert for ${patient.fullName}`,
              message: `Emergency EMR access was initiated for ${patient.fullName} by Dr. ${req.user?.fullName}. Reason: "${reason}".`,
              type: 'EMERGENCY',
              priority: 'CRITICAL',
            },
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Emergency session initiated. Critical clinical information unlocked.',
      session: emergencySession,
      emergencySession,
      data: emergencySession,
      patient: {
        id: patient.id,
        fullName: patient.fullName,
        healthId: patient.healthId,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        medications: patient.medications,
        conditions: patient.conditions,
        emergencyContacts: patient.emergencyContacts,
      },
      criticalInformation: {
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        currentMedicines: patient.medications,
        conditions: patient.conditions,
        emergencyContacts: patient.emergencyContacts,
        recentPrescriptions: patient.prescriptions,
      },
      blockchainProof: proof,
    });
  }

  /**
   * Add Emergency Treatment Note & seal with blockchain hash.
   */
  async addEmergencyTreatmentNote(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;
    const sessionId = req.params.sessionId as string;
    const { note } = req.body;

    if (!note) {
      res.status(400).json({ success: false, error: 'Emergency treatment note cannot be empty.' });
      return;
    }

    const session: any = await prisma.emergencySession.findUnique({
      where: { id: sessionId },
      include: { patient: true },
    });

    if (!session || session.doctorId !== doctorId) {
      res.status(404).json({ success: false, error: 'Emergency session not found.' });
      return;
    }

    const hash = calculateCanonicalSha256({
      sessionNumber: session.sessionNumber,
      patientHealthId: session.patient?.healthId,
      note,
      timestamp: new Date().toISOString(),
    });

    const proof = await blockchainService.registerRecordProof({
      recordId: session.sessionNumber,
      recordType: 'EMERGENCY_NOTE',
      eventType: 'RECORD_MODIFIED',
      payload: { sessionNumber: session.sessionNumber, note },
      referenceId: session.patient?.healthId || 'HP-100245',
    });

    const updated = await prisma.emergencySession.update({
      where: { id: sessionId },
      data: {
        emergencyTreatmentNote: note,
        treatmentNoteHash: hash,
        blockchainTxId: proof.transactionId,
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'DOCTOR',
      actorName: req.user!.fullName || 'Doctor',
      patientId: session.patientId,
      patientHealthId: session.patient?.healthId,
      doctorId,
      documentId: session.id,
      documentType: 'EMERGENCY_NOTE',
      action: 'EMERGENCY_NOTE',
      accessType: 'EMERGENCY',
      reason: 'Logged emergency resuscitation/treatment clinical note',
      authorizationStatus: 'EMERGENCY_OVERRIDE',
      blockchainTxId: proof.transactionId,
      severity: 'HIGH',
      ipAddress: req.ip as string,
    });

    res.json({ success: true, message: 'Emergency treatment note recorded and sealed.', session: updated });
  }

  /**
   * End Emergency Session manually.
   */
  async endEmergencySession(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;
    const sessionId = req.params.sessionId as string;

    const session: any = await prisma.emergencySession.findUnique({
      where: { id: sessionId },
      include: { patient: true },
    });

    if (!session || session.doctorId !== doctorId) {
      res.status(404).json({ success: false, error: 'Emergency session not found.' });
      return;
    }

    const updated = await prisma.emergencySession.update({
      where: { id: sessionId },
      data: {
        status: 'ENDED_MANUALLY',
        endTime: new Date(),
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'DOCTOR',
      actorName: req.user!.fullName || 'Doctor',
      patientId: session.patientId,
      patientHealthId: session.patient?.healthId,
      doctorId,
      documentId: session.id,
      documentType: 'EMERGENCY_NOTE',
      action: 'REVOKE',
      accessType: 'EMERGENCY',
      reason: `Emergency session ${session.sessionNumber} terminated manually by attending doctor. Access closed.`,
      severity: 'HIGH',
      ipAddress: req.ip as string,
    });

    res.json({ success: true, message: 'Emergency session closed. Temporary access revoked.', session: updated });
  }

  /**
   * Get all appointments for this doctor from PostgreSQL.
   */
  async getAppointments(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;
    if (!doctorId) {
      res.status(403).json({ success: false, error: 'DOCTOR_PROFILE_REQUIRED' });
      return;
    }

    const appointments = await prisma.appointment.findMany({
      where: { doctorId },
      include: {
        patient: { include: { user: true } },
        hospital: true,
      },
      orderBy: { date: 'asc' },
    });

    res.json({ success: true, appointments });
  }

  /**
   * Update appointment status (CONFIRMED, COMPLETED, CANCELLED) and notify patient.
   */
  async updateAppointmentStatus(req: Request, res: Response): Promise<void> {
    const doctorId = req.user?.doctorId;
    const id = req.params.id as string;
    const { status, notes } = req.body;

    if (!doctorId) {
      res.status(403).json({ success: false, error: 'DOCTOR_PROFILE_REQUIRED' });
      return;
    }

    const existing = await prisma.appointment.findFirst({
      where: { id, doctorId },
      include: {
        patient: { include: { user: true } },
        doctor: true,
      },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Appointment not found.' });
      return;
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: status || existing.status,
        notes: notes !== undefined ? notes : existing.notes,
      },
      include: {
        patient: true,
        hospital: true,
      },
    });

    // Section 30 & 31: Notify patient of appointment status update
    if (existing.patient?.userId) {
      await prisma.notification.create({
        data: {
          userId: existing.patient.userId,
          title: `Appointment ${status}`,
          message: `Your appointment ${existing.appointmentNumber} with Dr. ${existing.doctor.fullName} on ${existing.date} has been updated to ${status}.`,
          type: 'APPOINTMENT',
          category: 'APPOINTMENT',
          priority: status === 'CANCELLED' ? 'HIGH' : 'NORMAL',
          linkRoute: '/patient/appointments',
        },
      });
    }

    res.json({ success: true, message: `Appointment status updated to ${status}.`, appointment: updated });
  }
}

export const doctorController = new DoctorController();
