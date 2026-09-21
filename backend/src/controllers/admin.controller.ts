import { Request, Response } from 'express';
import { prisma } from '../models/prisma.js';
import { logAuditEvent } from '../middleware/audit.middleware.js';
import { blockchainService } from '../services/blockchain.service.js';
import { calculateCanonicalSha256, generateSecureRandomPassword } from '../utils/crypto.js';

export class AdminController {
  /**
   * Admin Dashboard KPIs & System Health.
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    const [
      totalPatients,
      approvedDoctors,
      pendingDoctors,
      totalHospitals,
      totalAppointments,
      activeEmergencies,
      totalAlerts,
      blockchainProofsCount,
      recentAlerts,
      recentAudits,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.doctor.count({ where: { regStatus: 'APPROVED' } }),
      prisma.doctor.count({ where: { regStatus: 'PENDING' } }),
      prisma.hospital.count(),
      prisma.appointment.count(),
      prisma.emergencySession.count({ where: { status: 'ACTIVE' } }),
      prisma.securityAlert.count({ where: { status: { in: ['NEW', 'INVESTIGATING'] } } }),
      prisma.blockchainProof.count(),
      prisma.securityAlert.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
      prisma.auditEvent.findMany({ take: 8, orderBy: { timestamp: 'desc' } }),
    ]);

    const blockchainStatus = await blockchainService.getStatus();

    res.json({
      success: true,
      stats: {
        totalPatients,
        approvedDoctors,
        pendingDoctors,
        totalHospitals,
        totalAppointments,
        activeEmergencies,
        securityAlertsCount: totalAlerts,
        blockchainProofsCount,
        integrityStatus: totalAlerts === 0 ? 'VERIFIED' : 'ATTENTION_REQUIRED',
      },
      blockchainStatus,
      recentAlerts,
      recentAudits,
    });
  }

  /**
   * Doctor Verification Queue.
   */
  async getDoctors(req: Request, res: Response): Promise<void> {
    const { status } = req.query;

    const doctors = await prisma.doctor.findMany({
      where: status ? { regStatus: status as string } : undefined,
      include: {
        user: true,
        affiliations: { include: { hospital: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedDoctors = doctors.map((doc) => {
      let govDetails = null;
      if (doc.govMismatchDetails) {
        try {
          govDetails = JSON.parse(doc.govMismatchDetails);
        } catch {}
      }
      return {
        ...doc,
        govVerificationResult: govDetails,
      };
    });

    res.json({ success: true, doctors: enrichedDoctors });
  }

  /**
   * Approve or Reject Doctor Verification.
   * On APPROVE: Generates a secure RANDOM temporary password, hashes it,
   * sets mustChangePassword = true, marks account ACTIVE, and returns the temporary password to Admin.
   * On REJECT: Rejection reason is mandatory, account is marked REJECTED / SUSPENDED.
   */
  async verifyDoctor(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { action, rejectionReason, notes } = req.body; // APPROVE, REJECT, SUSPEND

    const existingDoctor = await prisma.doctor.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingDoctor) {
      res.status(404).json({ success: false, error: 'Doctor not found.' });
      return;
    }

    if (action === 'REJECT' && !rejectionReason) {
      res.status(400).json({ success: false, error: 'Rejection reason is mandatory when declining doctor credentials.' });
      return;
    }

    const regStatus = action === 'APPROVE' ? 'APPROVED' : action === 'SUSPEND' ? 'SUSPENDED' : 'REJECTED';
    let temporaryPassword = '';

    if (action === 'APPROVE') {
      // Generate secure random temporary password (never fixed password like 1234 or Doctor@123)
      temporaryPassword = generateSecureRandomPassword(10);
      const passwordHash = calculateCanonicalSha256(temporaryPassword);

      // Update User account with hashed temporary password and flag mustChangePassword
      await prisma.user.update({
        where: { id: existingDoctor.userId },
        data: {
          passwordHash,
          status: 'ACTIVE',
          mustChangePassword: true,
        },
      });

      // Update Doctor record
      const updatedDoctor = await prisma.doctor.update({
        where: { id },
        data: {
          regStatus: 'APPROVED',
          mustChangePassword: true,
          rejectionReason: null,
          verificationNotes: notes || 'Credentials verified and approved by Administrator.',
          govtIdStatus: 'VERIFIED',
          degreeStatus: 'VERIFIED',
          experienceDocStatus: 'VERIFIED',
        },
        include: { user: true },
      });

      // Send in-app notification to doctor
      await prisma.notification.create({
        data: {
          userId: updatedDoctor.userId,
          title: 'Medical Accreditation Approved',
          message: 'Your medical registration credentials have been approved by Hospital Administration. A temporary password has been issued for your first sign-in.',
          type: 'SECURITY',
          priority: 'HIGH',
        },
      });

      await logAuditEvent({
        actorId: req.user!.id,
        actorRole: 'ADMIN',
        actorName: req.user!.fullName || 'Administrator',
        doctorId: updatedDoctor.id,
        doctorName: updatedDoctor.fullName,
        documentType: 'PROFILE',
        action: 'APPROVE',
        accessType: 'NORMAL',
        reason: `Admin approved credentials for ${updatedDoctor.fullName} (${updatedDoctor.registrationNumber}). Temporary password generated.`,
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: 'Doctor approved successfully. System-generated temporary password issued.',
        temporaryPassword,
        doctor: updatedDoctor,
      });
      return;
    }

    // Handle REJECT / SUSPEND
    await prisma.user.update({
      where: { id: existingDoctor.userId },
      data: {
        status: action === 'SUSPEND' ? 'SUSPENDED' : 'PENDING',
      },
    });

    const updatedDoctor = await prisma.doctor.update({
      where: { id },
      data: {
        regStatus,
        rejectionReason: action === 'REJECT' ? rejectionReason : null,
        verificationNotes: notes || `Verification ${regStatus.toLowerCase()} by Administrator.`,
        govtIdStatus: 'REJECTED',
        degreeStatus: 'REJECTED',
        experienceDocStatus: 'REJECTED',
      },
      include: { user: true },
    });

    await prisma.notification.create({
      data: {
        userId: updatedDoctor.userId,
        title: `Medical Registration ${regStatus}`,
        message: `Your registration status was updated to ${regStatus}: ${rejectionReason || notes || 'Please review your application documents.'}`,
        type: 'SECURITY',
        priority: 'HIGH',
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'ADMIN',
      actorName: req.user!.fullName || 'Administrator',
      doctorId: updatedDoctor.id,
      doctorName: updatedDoctor.fullName,
      documentType: 'PROFILE',
      action: 'REJECT',
      accessType: 'NORMAL',
      reason: `Admin rejected/suspended doctor credentials for ${updatedDoctor.fullName} (${updatedDoctor.registrationNumber}): ${rejectionReason || notes || ''}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Doctor status updated to ${regStatus}.`,
      doctor: updatedDoctor,
    });
  }

  /**
   * Hospital Management (List, Add, Edit, Toggle Status).
   */
  async getHospitals(req: Request, res: Response): Promise<void> {
    const hospitals = await prisma.hospital.findMany({
      include: { departments: true, doctorAffiliations: { include: { doctor: true } } },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, hospitals });
  }

  async createHospital(req: Request, res: Response): Promise<void> {
    const { name, address, city, state, pincode, phone, email, emergencyPhone, departments } = req.body;

    if (!name || !city || !phone) {
      res.status(400).json({ success: false, error: 'Hospital name, city, and phone are required.' });
      return;
    }

    const hospital = await prisma.hospital.create({
      data: {
        name,
        address: address || 'Main Road',
        city,
        state: state || 'Telangana',
        pincode: pincode || '500001',
        phone,
        email: email || 'info@hospital.internal',
        emergencyPhone: emergencyPhone || phone,
        emergencyAvailable: true,
        departments: departments && Array.isArray(departments)
          ? { create: departments.map((d: string) => ({ name: d })) }
          : undefined,
      },
    });

    res.status(201).json({ success: true, hospital });
  }

  async updateHospitalStatus(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { status } = req.body;

    const hospital = await prisma.hospital.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, hospital });
  }

  /**
   * User Management (Patients, Doctors, Admins - Suspend / Activate).
   * Note: Admin cannot silently edit medical records!
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    const { role, status, search } = req.query;

    const where: any = {};
    if (role) where.role = role as string;
    if (status) where.status = status as string;
    if (search && typeof search === 'string') {
      where.OR = [
        { email: { contains: search } },
        { mobile: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: { patient: true, doctor: true, admin: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ success: true, users });
  }

  async updateUserStatus(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { status, reason } = req.body; // ACTIVE, SUSPENDED

    const user = await prisma.user.update({
      where: { id },
      data: { status },
      include: { patient: true, doctor: true },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'ADMIN',
      actorName: req.user!.fullName || 'Administrator',
      documentType: 'PROFILE',
      action: status === 'SUSPENDED' ? 'REJECT' : 'APPROVE',
      accessType: 'NORMAL',
      reason: `Admin updated user status to ${status}. Reason: ${reason || 'Administrative action'}`,
      ipAddress: req.ip,
      severity: 'MEDIUM',
    });

    res.json({ success: true, message: `User status changed to ${status}.`, user });
  }

  /**
   * Audit Center: Complete read-only audit log with multi-criteria filters.
   */
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    const { actorRole, action, documentType, severity, accessType, patientHealthId, search, limit = '100' } = req.query;

    const where: any = {};
    if (actorRole) where.actorRole = actorRole as string;
    if (action) where.action = action as string;
    if (documentType) where.documentType = documentType as string;
    if (severity) where.severity = severity as string;
    if (accessType) where.accessType = accessType as string;
    if (patientHealthId) where.patientHealthId = patientHealthId as string;
    if (search && typeof search === 'string') {
      where.OR = [
        { actorName: { contains: search } },
        { reason: { contains: search } },
        { documentId: { contains: search } },
        { patientHealthId: { contains: search } },
      ];
    }

    const audits = await prisma.auditEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string, 10),
    });

    res.json({ success: true, count: audits.length, audits, logs: audits });
  }

  /**
   * Security Center: Monitor alerts, investigations, hash mismatches.
   */
  async getSecurityAlerts(req: Request, res: Response): Promise<void> {
    const { status, severity } = req.query;

    const where: any = {};
    if (status) where.status = status as string;
    if (severity) where.severity = severity as string;

    const alerts = await prisma.securityAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, alerts });
  }

  async updateAlertStatus(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { status, resolutionNotes } = req.body; // INVESTIGATING, REVIEWED, RESOLVED

    const alert = await prisma.securityAlert.update({
      where: { id },
      data: {
        status,
        resolvedByAdminId: req.user?.id,
        resolutionNotes,
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'ADMIN',
      actorName: req.user!.fullName || 'Administrator',
      documentType: 'AUTH',
      documentId: id,
      action: 'APPROVE',
      accessType: 'NORMAL',
      reason: `Admin updated security incident status to ${status}. Notes: ${resolutionNotes || 'None'}`,
      ipAddress: req.ip,
      severity: 'LOW',
    });

    res.json({ success: true, message: `Security alert status updated to ${status}.`, alert });
  }

  /**
   * Blockchain Explorer & Proofs.
   */
  async getBlockchainProofs(req: Request, res: Response): Promise<void> {
    const proofs = await prisma.blockchainProof.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const status = await blockchainService.getStatus();

    res.json({ success: true, networkStatus: status, proofs });
  }

  /**
   * Interactive Tampering Simulator:
   * Modifies a test copy of a record's data to test cryptographic tampering detection live.
   * Compares against the registered blockchain proof, raises HASH_MISMATCH SecurityAlert and logs AuditEvent.
   */
  async simulateTamperingTest(req: Request, res: Response): Promise<void> {
    const { recordId = 'LR-2031', recordType = 'LAB_REPORT', tamperedValue = 'Cholesterol artificially manipulated to 95 mg/dL' } = req.body;

    // 1. Fetch registered record and proof
    let proof = await prisma.blockchainProof.findFirst({
      where: { recordId },
    });

    if (!proof) {
      proof = await prisma.blockchainProof.findFirst();
    }

    if (!proof) {
      res.status(404).json({ success: false, error: 'No registered blockchain proof found.' });
      return;
    }

    const targetRecordId = proof.recordId;
    const targetRecordType = proof.recordType;

    // 2. Build tampered data payload
    const tamperedPayload = {
      recordId: targetRecordId,
      tamperedData: tamperedValue,
      unauthorizedModification: true,
      timestamp: new Date().toISOString(),
    };

    // 3. Verify against blockchain proof -> This triggers hash mismatch & creates SecurityAlert!
    const result = await blockchainService.verifyRecordProof({
      recordId: targetRecordId,
      recordType: targetRecordType,
      currentPayload: tamperedPayload,
      actorId: req.user!.id,
      actorName: req.user!.fullName || 'Admin Simulator',
    });

    res.json({
      success: true,
      message: 'Tampering simulation test executed.',
      tampered: !result.verified,
      tamperingDetected: !result.verified,
      status: result.status,
      alertGenerated: !result.verified,
      verificationResult: result,
    });
  }

  /**
   * Emergency Sessions Monitoring.
   */
  async getEmergencySessions(req: Request, res: Response): Promise<void> {
    const sessions = await prisma.emergencySession.findMany({
      include: {
        patient: true,
        doctor: true,
        hospital: true,
      },
      orderBy: { startTime: 'desc' },
    });

    res.json({ success: true, sessions });
  }

  /**
   * Helpdesk Support: View all tickets submitted across the system.
   */
  async getHelpdeskTickets(req: Request, res: Response): Promise<void> {
    const tickets = await prisma.correctionRequest.findMany({
      include: {
        patient: { include: { user: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, tickets });
  }

  /**
   * Helpdesk Support: Admin responds to ticket and updates status (OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED).
   */
  async updateHelpdeskTicket(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { status, reviewNotes, adminResponse } = req.body;
    const responseText = adminResponse !== undefined ? adminResponse : reviewNotes;

    const existing = await prisma.correctionRequest.findUnique({
      where: { id },
      include: {
        patient: { include: { user: true } },
      },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Helpdesk ticket not found.' });
      return;
    }

    const updated = await prisma.correctionRequest.update({
      where: { id },
      data: {
        status: status || existing.status,
        reviewNotes: responseText !== undefined ? responseText : existing.reviewNotes,
        reviewedBy: req.user?.fullName || 'Administrator',
      },
      include: {
        patient: true,
      },
    });

    // Section 31 & 35: Notify patient of helpdesk ticket update & admin response
    if (existing.patient?.userId) {
      await prisma.notification.create({
        data: {
          userId: existing.patient.userId,
          title: `Helpdesk Ticket ${status ? status.toUpperCase() : 'Updated'}`,
          message: responseText
            ? `Admin response on "${existing.fieldName}": ${responseText}`
            : `Your ticket "${existing.fieldName}" status was updated to ${status}.`,
          type: 'RECORD',
          category: 'GENERAL',
          priority: 'NORMAL',
          linkRoute: '/patient/helpdesk',
        },
      });
    }

    res.json({ success: true, message: 'Helpdesk ticket updated.', ticket: updated });
  }
}

export const adminController = new AdminController();
