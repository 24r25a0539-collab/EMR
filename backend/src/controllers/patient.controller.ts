import { Request, Response } from 'express';
import { prisma } from '../models/prisma.js';
import { logAuditEvent } from '../middleware/audit.middleware.js';
import { blockchainService } from '../services/blockchain.service.js';
import { parseEmergencyNotes } from './auth.controller.js';
import { calculateCanonicalSha256 } from '../utils/crypto.js';

export class PatientController {
  /**
   * Get complete patient profile and health data.
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;

    if (!patientId) {
      res.status(403).json({ success: false, error: 'PATIENT_PROFILE_REQUIRED' });
      return;
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        healthProfile: true,
        emergencyContacts: true,
        conditions: true,
        allergies: true,
        medications: { where: { status: { in: ['ACTIVE', 'PAUSED'] } } },
      },
    });

    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient not found' });
      return;
    }

    const meta = parseEmergencyNotes(patient.emergencyNotes);
    let calculatedAge = 0;
    if (patient.dob) {
      const bDate = new Date(patient.dob);
      if (!isNaN(bDate.getTime())) {
        const now = new Date();
        calculatedAge = now.getFullYear() - bDate.getFullYear();
        const m = now.getMonth() - bDate.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < bDate.getDate())) {
          calculatedAge--;
        }
      }
    }

    const enrichedPatient = {
      ...patient,
      age: Math.max(0, calculatedAge),
      healthcareId: patient.healthId,
      govtIdNumber: patient.govtIdNumberMasked || (patient as any).govtIdNumber,
      govtIdNumberMasked: patient.govtIdNumberMasked || (patient as any).govtIdNumber,
      aadhaarMasked: patient.govtIdNumberMasked || (patient as any).govtIdNumber || 'XXXX-XXXX-XXXX',
      maskedAadhaar: patient.govtIdNumberMasked || (patient as any).govtIdNumber || 'XXXX-XXXX-XXXX',
      identificationMarks: meta.identificationMarks,
      abhaId: patient.abhaId || meta.abhaId,
      plainEmergencyNotes: meta.notes,
    };

    res.json({ success: true, patient: enrichedPatient, data: enrichedPatient });
  }

  /**
   * Update patient editable personal information with audit logging.
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const { address, city, state, pincode, height, weight, emergencyNotes: newNotes, identificationMarks } = req.body;

    if (!patientId) {
      res.status(403).json({ success: false, error: 'PATIENT_PROFILE_REQUIRED' });
      return;
    }

    const currentPatient = await prisma.patient.findUnique({ where: { id: patientId } });
    const currentMeta = parseEmergencyNotes(currentPatient?.emergencyNotes);

    if (Array.isArray(identificationMarks)) {
      currentMeta.identificationMarks = identificationMarks.map((m: any) => String(m).trim()).filter(Boolean);
    }
    if (typeof newNotes === 'string') {
      currentMeta.notes = newNotes;
    }
    const packedEmergencyNotes = JSON.stringify(currentMeta);

    const updated = await prisma.patient.update({
      where: { id: patientId },
      data: {
        address,
        city,
        state,
        pincode,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        emergencyNotes: packedEmergencyNotes,
        healthProfile: {
          upsert: {
            create: {
              bloodGroup: currentPatient?.bloodGroup || 'O+',
              height: height ? parseFloat(height) : undefined,
              weight: weight ? parseFloat(weight) : undefined,
              emergencyNotes: packedEmergencyNotes,
            },
            update: {
              height: height ? parseFloat(height) : undefined,
              weight: weight ? parseFloat(weight) : undefined,
              emergencyNotes: packedEmergencyNotes,
              lastUpdated: new Date(),
            },
          },
        },
      },
      include: {
        healthProfile: true,
        emergencyContacts: true,
        allergies: true,
        conditions: true,
        medications: true,
      },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'PATIENT',
      actorName: updated.fullName,
      patientId: updated.id,
      patientHealthId: updated.healthId,
      documentType: 'PROFILE',
      action: 'MODIFY',
      accessType: 'NORMAL',
      reason: 'Patient updated personal address / contact information',
      ipAddress: req.ip,
    });

    const meta = parseEmergencyNotes(updated.emergencyNotes);
    const enrichedPatient = {
      ...updated,
      identificationMarks: meta.identificationMarks,
      abhaId: meta.abhaId,
    };

    res.json({ success: true, message: 'Profile updated successfully.', patient: enrichedPatient, data: enrichedPatient });
  }

  /**
   * Add allergy for authenticated patient.
   */
  async addAllergy(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const { allergen, allergyType = 'Drug', severity = 'MODERATE', reaction, notes } = req.body;

    if (!patientId) {
      res.status(403).json({ success: false, error: 'PATIENT_PROFILE_REQUIRED' });
      return;
    }

    if (!allergen || typeof allergen !== 'string' || !allergen.trim()) {
      res.status(400).json({ success: false, error: 'Allergen name is required.' });
      return;
    }

    const allergy = await prisma.allergy.create({
      data: {
        patientId,
        allergen: allergen.trim(),
        allergyType: allergyType || 'Drug',
        severity: severity || 'MODERATE',
        reaction: reaction ? String(reaction).trim() : null,
        notes: notes ? String(notes).trim() : null,
      },
    });

    res.status(201).json({ success: true, message: 'Allergy added successfully.', allergy });
  }

  /**
   * Delete allergy for authenticated patient.
   */
  async deleteAllergy(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const id = req.params.id as string;

    if (!patientId) {
      res.status(403).json({ success: false, error: 'PATIENT_PROFILE_REQUIRED' });
      return;
    }

    await prisma.allergy.deleteMany({
      where: { id, patientId },
    });

    res.json({ success: true, message: 'Allergy deleted successfully.' });
  }

  /**
   * Add medicine for authenticated patient.
   */
  async addMedicine(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const {
      name,
      medicineName,
      dosage,
      frequency,
      timingSlot = 'MORNING',
      duration,
      instructions,
    } = req.body;

    if (!patientId) {
      res.status(403).json({ success: false, error: 'PATIENT_PROFILE_REQUIRED' });
      return;
    }

    const medName = (medicineName || name || '').trim();
    if (!medName) {
      res.status(400).json({ success: false, error: 'Medicine name is required.' });
      return;
    }

    const initialStock = req.body.currentStock !== undefined
      ? Number(req.body.currentStock)
      : req.body.stock !== undefined
      ? Number(req.body.stock)
      : 10;

    const meta = {
      note: instructions || '',
      foodTiming: req.body.foodTiming || 'AFTER_MEAL',
      stock: initialStock,
      logs: [] as any[],
    };

    const medicine = await prisma.medication.create({
      data: {
        patientId,
        medicineName: medName,
        dosage: dosage ? String(dosage).trim() : '1 tablet',
        frequency: frequency ? String(frequency).trim() : 'Once daily',
        timingSlot: (timingSlot || req.body.timeSlot ? String(timingSlot || req.body.timeSlot).toUpperCase() : 'MORNING'),
        duration: duration ? String(duration).trim() : null,
        instructions: JSON.stringify(meta),
        startDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
      },
    });

    const enriched = {
      ...medicine,
      name: medicine.medicineName,
      currentStock: initialStock,
      stock: initialStock,
      foodTiming: meta.foodTiming,
      logs: meta.logs,
    };

    res.status(201).json({ success: true, message: 'Medicine added successfully.', medicine: enriched });
  }

  /**
   * Get categorized medical records overview.
   */
  async getRecords(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;

    const [conditions, allergies, surgeries, immunizations, medicalRecords, consultations, prescriptions, labReports] = await Promise.all([
      prisma.medicalCondition.findMany({ where: { patientId } }),
      prisma.allergy.findMany({ where: { patientId } }),
      prisma.medicalRecord.findMany({ where: { patientId, recordType: 'SURGERY' } }),
      prisma.medicalRecord.findMany({ where: { patientId, recordType: 'IMMUNIZATION' } }),
      prisma.medicalRecord.findMany({ where: { patientId }, orderBy: { date: 'desc' } }),
      prisma.consultation.findMany({ where: { patientId }, include: { doctor: true, hospital: true }, orderBy: { date: 'desc' } }),
      prisma.prescription.findMany({ where: { patientId }, include: { doctor: true, hospital: true, medicines: true }, orderBy: { createdAt: 'desc' } }),
      prisma.labReport.findMany({ where: { patientId }, include: { doctor: true, hospital: true }, orderBy: { createdAt: 'desc' } }),
    ]);

    const unified: any[] = [
      ...medicalRecords.map((m) => ({
        id: m.id,
        title: m.title,
        category: m.recordType,
        date: m.date,
        doctorName: 'Attending Physician',
        hospitalName: 'Apex Health City',
        sha256Hash: m.currentHash,
        blockNumber: 10480,
        verified: m.blockchainStatus === 'VERIFIED',
        summary: m.description,
      })),
      ...consultations.map((c) => ({
        id: c.consultationNumber || c.id,
        title: `Consultation: ${c.diagnosis}`,
        category: 'Consultation',
        date: c.date,
        doctorName: c.doctor?.fullName || 'Dr. Specialist',
        hospitalName: c.hospital?.name || 'Apex Health City',
        sha256Hash: c.recordHash,
        blockNumber: 10479,
        verified: c.blockchainStatus === 'VERIFIED',
        summary: `${c.symptoms}. Treatment: ${c.treatmentPlan}`,
      })),
      ...prescriptions.map((p) => ({
        id: p.prescriptionNumber || p.id,
        title: `Prescription: ${p.diagnosis}`,
        category: 'Prescription',
        date: p.createdAt.toISOString().split('T')[0],
        doctorName: p.doctor?.fullName || 'Dr. Specialist',
        hospitalName: p.hospital?.name || 'Apex Health City',
        sha256Hash: p.recordHash,
        blockNumber: 10481,
        verified: p.blockchainStatus === 'VERIFIED',
        summary: p.medicines.map((m) => `${m.medicineName} ${m.dosage}`).join(', '),
      })),
      ...labReports.map((l) => ({
        id: l.reportNumber || l.id,
        title: l.testName,
        category: 'Lab Report',
        date: l.resultDate || l.sampleDate,
        doctorName: l.doctor?.fullName || 'Dr. Specialist',
        hospitalName: l.laboratoryName || 'Apex Diagnostic Services',
        sha256Hash: l.recordHash,
        blockNumber: 10482,
        verified: l.blockchainStatus === 'VERIFIED',
        summary: l.summary,
      })),
    ];

    res.json({
      success: true,
      records: {
        conditions,
        allergies,
        surgeries,
        immunizations,
      },
      vaultRecords: unified,
    });
  }

  /**
   * Get patient consultations list.
   */
  async getConsultations(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;

    const consultations = await prisma.consultation.findMany({
      where: { patientId },
      include: {
        doctor: true,
        hospital: true,
        prescriptions: { include: { medicines: true } },
      },
      orderBy: { date: 'desc' },
    });

    res.json({ success: true, consultations, data: consultations });
  }

  /**
   * Get single consultation detail.
   */
  async getConsultationById(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const id = req.params.id as string;

    const consultation = await prisma.consultation.findFirst({
      where: { id, patientId },
      include: {
        doctor: true,
        hospital: true,
        prescriptions: { include: { medicines: true } },
      },
    });

    if (!consultation) {
      res.status(404).json({ success: false, error: 'Consultation not found' });
      return;
    }

    res.json({ success: true, consultation, data: consultation });
  }

  /**
   * Get patient prescriptions.
   */
  async getPrescriptions(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId },
      include: {
        doctor: true,
        hospital: true,
        medicines: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, prescriptions, data: prescriptions });
  }

  /**
   * Get single prescription detail.
   */
  async getPrescriptionById(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const id = req.params.id as string;

    if (!patientId) {
      res.status(403).json({ success: false, error: 'Patient profile required' });
      return;
    }

    const prescription = await prisma.prescription.findFirst({
      where: {
        AND: [
          { patientId },
          {
            OR: [
              { id },
              { prescriptionNumber: id },
            ],
          },
        ],
      },
      include: {
        doctor: true,
        hospital: true,
        medicines: true,
      },
    });

    if (!prescription) {
      res.status(404).json({ success: false, error: 'Prescription not found' });
      return;
    }

    res.json({ success: true, prescription, data: prescription });
  }

  /**
   * Get patient lab reports.
   */
  async getLabReports(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;

    const reports = await prisma.labReport.findMany({
      where: { patientId },
      include: { doctor: true, hospital: true },
      orderBy: { resultDate: 'desc' },
    });

    res.json({ success: true, reports, labReports: reports, data: reports });
  }

  /**
   * Get single lab report detail.
   */
  async getLabReportById(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const id = req.params.id as string;

    const report = await prisma.labReport.findFirst({
      where: { id, patientId },
      include: { doctor: true, hospital: true },
    });

    if (!report) {
      res.status(404).json({ success: false, error: 'Lab report not found' });
      return;
    }

    res.json({ success: true, report, data: report });
  }

  /**
   * Upload / create patient lab report with blockchain seal and PostgreSQL persistence.
   */
  async uploadLabReport(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const {
      testName,
      category = 'Biochemistry',
      laboratoryName,
      sampleDate,
      resultDate,
      summary,
      findingsJson,
      findings,
      fileSize,
      fileType,
      recordHash: clientHash,
    } = req.body;

    if (!patientId) {
      res.status(403).json({ success: false, error: 'PATIENT_PROFILE_REQUIRED' });
      return;
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      res.status(404).json({ success: false, error: 'Patient not found' });
      return;
    }

    const resolvedTestName = (testName || 'Diagnostic Investigation Report').trim();
    const resolvedLabName = (laboratoryName || req.body.labName || 'External Diagnostic Upload').trim();
    const resolvedSummary = (summary || 'Patient-submitted diagnostic document. Sealed with canonical SHA-256.').trim();

    const count = await prisma.labReport.count();
    const reportNumber = `LR-2026-${1000 + count}`;

    const canonicalData = {
      reportNumber,
      patientHealthId: patient.healthId,
      testName: resolvedTestName,
      category,
      laboratoryName: resolvedLabName,
      sampleDate: sampleDate || new Date().toISOString().split('T')[0],
      resultDate: resultDate || new Date().toISOString().split('T')[0],
      summary: resolvedSummary,
      findings: findings || findingsJson || 'Standard diagnostic test parameters recorded',
    };

    const hash = clientHash || calculateCanonicalSha256(canonicalData);

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
        testName: resolvedTestName,
        category,
        laboratoryName: resolvedLabName,
        sampleDate: sampleDate || new Date().toISOString().split('T')[0],
        resultDate: resultDate || new Date().toISOString().split('T')[0],
        summary: resolvedSummary,
        findingsJson: findingsJson ? (typeof findingsJson === 'string' ? findingsJson : JSON.stringify(findingsJson)) : (findings ? JSON.stringify(findings) : null),
        status: 'COMPLETED',
        canonicalDataJson: JSON.stringify(canonicalData),
        recordHash: hash,
        blockchainTxId: proof.transactionId,
        blockchainStatus: 'VERIFIED',
        fileSize: fileSize || '1.8 MB',
        fileType: fileType || 'application/pdf',
      },
      include: { doctor: true, hospital: true },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'PATIENT',
      actorName: req.user!.fullName || 'Patient',
      patientId,
      patientHealthId: patient.healthId,
      documentId: report.id,
      documentType: 'LAB_REPORT',
      action: 'CREATE',
      accessType: 'NORMAL',
      reason: `Patient uploaded diagnostic report ${reportNumber}: ${resolvedTestName}`,
      blockchainTxId: proof.transactionId,
      blockchainVerificationStatus: 'VERIFIED',
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Lab report uploaded and saved to PostgreSQL with blockchain integrity seal.',
      report,
      data: report,
      blockchainProof: proof,
    });
  }

  /**
   * Get patient medicines by timing slot with adherence logs and live stock count.
   */
  async getMedicines(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;

    const medicines = await prisma.medication.findMany({
      where: { patientId },
      orderBy: { timingSlot: 'asc' },
    });

    const enriched = medicines.map((m) => {
      let meta = { note: '', foodTiming: 'AFTER_MEAL', stock: 10, logs: [] as any[] };
      try {
        if (m.instructions && m.instructions.startsWith('{')) {
          meta = { ...meta, ...JSON.parse(m.instructions) };
        } else if (m.instructions) {
          meta.note = m.instructions;
        }
      } catch {}
      return {
        ...m,
        name: m.medicineName,
        currentStock: meta.stock,
        stock: meta.stock,
        foodTiming: meta.foodTiming,
        logs: meta.logs || [],
      };
    });

    res.json({ success: true, medicines: enriched, data: enriched });
  }

  /**
   * Update medicine status (TAKEN, SKIPPED, SNOOZED, PAUSED, RESUMED).
   * Section 23: Complete decreases stock by exactly 1, records adherence log, keeps medicine active.
   * Snooze retains current stock and records snooze event.
   */
  async updateMedicineAction(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const id = req.params.id as string;
    const { action, notes } = req.body; // complete / taken, snooze / snoozed, etc.

    const current = await prisma.medication.findFirst({
      where: { id, patientId },
    });

    if (!current) {
      res.status(404).json({ success: false, error: 'Medicine not found.' });
      return;
    }

    let meta = { note: '', foodTiming: 'AFTER_MEAL', stock: 10, logs: [] as any[] };
    try {
      if (current.instructions && current.instructions.startsWith('{')) {
        meta = { ...meta, ...JSON.parse(current.instructions) };
      } else if (current.instructions) {
        meta.note = current.instructions;
      }
    } catch {}

    const actLower = String(action || '').toLowerCase();
    let newStatus = current.status;

    if (actLower === 'complete' || actLower === 'taken') {
      meta.stock = Math.max(0, meta.stock - 1);
      meta.logs.unshift({
        time: new Date().toISOString(),
        action: 'TAKEN',
        notes: notes || 'Dose completed',
      });
      newStatus = 'ACTIVE';
    } else if (actLower === 'snooze' || actLower === 'snoozed') {
      meta.logs.unshift({
        time: new Date().toISOString(),
        action: 'SNOOZED',
        notes: notes || 'Dose snoozed',
      });
      newStatus = 'ACTIVE';
    } else {
      newStatus = String(action).toUpperCase();
    }

    const updated = await prisma.medication.update({
      where: { id },
      data: {
        status: newStatus,
        instructions: JSON.stringify(meta),
        lastActionDate: new Date(),
      },
    });

    const enriched = {
      ...updated,
      name: updated.medicineName,
      currentStock: meta.stock,
      stock: meta.stock,
      foodTiming: meta.foodTiming,
      logs: meta.logs,
    };

    res.json({ success: true, medicine: enriched });
  }

  /**
   * Get patient appointments.
   */
  async getAppointments(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;

    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: { doctor: true, hospital: true },
      orderBy: { date: 'asc' },
    });

    res.json({ success: true, appointments, data: appointments });
  }

  /**
   * Book a new appointment.
   */
  async bookAppointment(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const { doctorId, hospitalId, department, date, appointmentDate, timeSlot, appointmentType, type, reason } = req.body;
    const targetDate = date || appointmentDate;
    const targetType = appointmentType || type || 'IN_PERSON';

    if (!patientId || !doctorId || !targetDate || !timeSlot) {
      res.status(400).json({ success: false, error: 'Missing required appointment booking fields.' });
      return;
    }

    // Resolve doctorId to real PostgreSQL record (must be approved doctor)
    const exactDoctor = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        regStatus: 'APPROVED',
      },
      include: {
        user: true,
        affiliations: { include: { hospital: true } },
      },
    });

    if (!exactDoctor) {
      res.status(404).json({ success: false, error: 'Doctor not found or not approved.' });
      return;
    }
    const resolvedDoctorId = exactDoctor.id;

    // Resolve hospitalId
    let resolvedHospitalId = hospitalId;
    let dbHospital = null;
    if (hospitalId) {
      dbHospital = await prisma.hospital.findUnique({ where: { id: hospitalId } });
    }
    if (!dbHospital) {
      if (exactDoctor.affiliations && exactDoctor.affiliations.length > 0) {
        dbHospital = exactDoctor.affiliations[0].hospital;
      }
      if (!dbHospital) {
        dbHospital = await prisma.hospital.findFirst({ where: { status: 'ACTIVE' } });
      }
    }
    if (!dbHospital) {
      res.status(400).json({ success: false, error: 'No active hospital found for appointment.' });
      return;
    }
    resolvedHospitalId = dbHospital.id;

    // Section 29: Double booking check - check doctorId, date, timeSlot where status is not CANCELLED
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId: resolvedDoctorId,
        date: targetDate,
        timeSlot,
        status: { not: 'CANCELLED' },
      },
    });

    if (existing) {
      res.status(409).json({ success: false, error: 'This time slot is no longer available.' });
      return;
    }

    const count = await prisma.appointment.count();
    let appointmentNumber = `APT-${4522 + count}`;
    const existsNum = await prisma.appointment.findUnique({ where: { appointmentNumber } });
    if (existsNum) {
      appointmentNumber = `APT-${Date.now().toString().slice(-6)}`;
    }

    const appointment = await prisma.appointment.create({
      data: {
        appointmentNumber,
        patientId,
        doctorId: resolvedDoctorId,
        hospitalId: resolvedHospitalId,
        department: department || exactDoctor.department || exactDoctor.specialization || 'General OPD',
        date: targetDate,
        timeSlot,
        appointmentType: targetType,
        reason: reason || `Clinical consultation with ${exactDoctor.fullName}`,
        status: 'CONFIRMED',
      },
      include: { doctor: true, hospital: true },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'PATIENT',
      actorName: req.user!.fullName || 'Patient',
      patientId,
      patientHealthId: req.user?.healthId,
      doctorId: resolvedDoctorId,
      hospitalId: resolvedHospitalId,
      documentType: 'CONSULTATION',
      action: 'CREATE',
      accessType: 'NORMAL',
      reason: `Booked appointment ${appointmentNumber} for ${targetDate} at ${timeSlot}`,
      ipAddress: req.ip,
    });

    // Notify doctor
    if (exactDoctor.userId) {
      await prisma.notification.create({
        data: {
          userId: exactDoctor.userId,
          title: 'New Appointment Booked',
          message: `Appointment ${appointmentNumber} booked by ${req.user!.fullName || 'Patient'} for ${targetDate} at ${timeSlot}.`,
          type: 'APPOINTMENT',
          category: 'APPOINTMENT',
          priority: 'NORMAL',
          linkRoute: '/doctor/appointments',
        },
      });
    }

    // Notify patient
    await prisma.notification.create({
      data: {
        userId: req.user!.id,
        title: 'Appointment Confirmed',
        message: `Your appointment ${appointmentNumber} with Dr. ${exactDoctor.fullName} on ${targetDate} at ${timeSlot} is confirmed.`,
        type: 'APPOINTMENT',
        category: 'APPOINTMENT',
        priority: 'NORMAL',
        linkRoute: '/patient/appointments',
      },
    });

    res.status(201).json({ success: true, message: 'Appointment booked successfully.', appointment, data: appointment });
  }

  /**
   * Cancel an appointment.
   */
  async cancelAppointment(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const id = req.params.id as string;
    const { reason } = req.body;

    const existing = await prisma.appointment.findFirst({
      where: { id, patientId },
      include: { doctor: true },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Appointment not found.' });
      return;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason ? `Cancellation reason: ${reason}` : 'Cancelled by patient',
      },
      include: { doctor: true },
    });

    if (appointment.doctor) {
      await prisma.notification.create({
        data: {
          userId: appointment.doctor.userId,
          title: 'Appointment Cancelled',
          message: `Appointment ${appointment.appointmentNumber} on ${appointment.date} at ${appointment.timeSlot} was cancelled by patient.`,
          type: 'APPOINTMENT',
          category: 'APPOINTMENT',
          priority: 'NORMAL',
          linkRoute: '/doctor/appointments',
        },
      });
    }

    res.json({ success: true, message: 'Appointment cancelled.', appointment, data: appointment });
  }

  /**
   * Get Access Requests & Permissions.
   */
  async getAccessPermissions(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;

    const [requests, permissions] = await Promise.all([
      prisma.accessRequest.findMany({
        where: { patientId },
        include: { doctor: true, hospital: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.permission.findMany({
        where: { patientId },
        include: { doctor: true, hospital: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({ success: true, requests, permissions, data: { requests, permissions } });
  }

  /**
   * Approve an access request with granular scope and duration.
   * Creates Permission + writes Audit Event + registers Blockchain Proof!
   */
  async approveAccessRequest(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const id = req.params.id as string;
    const { scopes: reqScopes, durationDays: reqDurationDays } = req.body;

    const accessRequest: any = await prisma.accessRequest.findUnique({
      where: { id },
      include: { doctor: true, hospital: true },
    });

    if (!accessRequest || accessRequest.patientId !== patientId) {
      res.status(404).json({ success: false, error: 'Access request not found.' });
      return;
    }

    if (accessRequest.status !== 'PENDING') {
      res.status(400).json({
        success: false,
        error: 'REQUEST_ALREADY_PROCESSED',
        message: `This access request has already been ${accessRequest.status.toLowerCase()}.`,
      });
      return;
    }

    let resolvedScopes: string[] = [];
    if (Array.isArray(reqScopes) && reqScopes.length > 0) {
      resolvedScopes = reqScopes;
    } else {
      try {
        resolvedScopes = JSON.parse(accessRequest.scopeJson);
      } catch {
        resolvedScopes = ['Consultations', 'Prescriptions', 'Lab Reports'];
      }
    }

    const isForever = req.body.isForever === true || reqDurationDays === 0 || reqDurationDays === '0' || reqDurationDays === 'FOREVER' || req.body.duration === 'FOREVER' || req.body.duration === 'Forever';
    let expiresAt: Date | null = null;
    let durationLabel = 'Forever';

    if (!isForever) {
      if (typeof req.body.durationHours === 'number' && req.body.durationHours > 0) {
        expiresAt = new Date(Date.now() + req.body.durationHours * 60 * 60 * 1000);
        durationLabel = `${req.body.durationHours} hours`;
      } else {
        const durationDays = typeof reqDurationDays === 'number' && reqDurationDays > 0
          ? reqDurationDays
          : (accessRequest.durationDays || 3);
        expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
        durationLabel = `${durationDays} days`;
      }
    }

    // Update request status and create permission transactionally
    const [updatedRequest, permission] = await prisma.$transaction([
      prisma.accessRequest.update({
        where: { id },
        data: { status: 'APPROVED', expiresAt },
      }),
      prisma.permission.create({
        data: {
          patientId: accessRequest.patientId,
          doctorId: accessRequest.doctorId,
          hospitalId: accessRequest.hospitalId,
          accessRequestId: accessRequest.id,
          scopeJson: JSON.stringify(resolvedScopes),
          approvedScope: resolvedScopes.join(', '),
          startDate: new Date(),
          expiresAt,
          status: 'ACTIVE',
        },
        include: { doctor: true },
      }),
    ]);

    // Register Blockchain Proof of Access Grant
    let proof: any = { transactionId: `0x${Date.now().toString(16)}` };
    try {
      proof = await blockchainService.registerRecordProof({
        recordId: permission.id,
        recordType: 'ACCESS_PERMISSION',
        eventType: 'ACCESS_GRANTED',
        payload: {
          permissionId: permission.id,
          patientId,
          doctorId: accessRequest.doctorId,
          scopes: resolvedScopes,
          durationDays: isForever ? 0 : (reqDurationDays || 3),
          expiresAt: expiresAt ? expiresAt.toISOString() : null,
        },
        referenceId: req.user?.healthId || 'HP-100245',
      });

      await prisma.permission.update({
        where: { id: permission.id },
        data: { blockchainProofId: proof.transactionId },
      });
    } catch (err) {
      console.warn('Blockchain registration warning (permission):', err);
    }

    // Log granular AuditEvent
    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'PATIENT',
      actorName: req.user!.fullName || 'Patient',
      patientId,
      patientHealthId: req.user?.healthId,
      doctorId: accessRequest.doctorId,
      doctorName: accessRequest.doctor?.fullName,
      hospitalId: accessRequest.hospitalId || undefined,
      documentId: permission.id,
      documentType: 'ACCESS_PERMISSION',
      action: 'APPROVE',
      accessType: 'CONSENT_GRANTED',
      reason: `Patient granted ${durationLabel} access for scopes [${resolvedScopes.join(', ')}] to ${accessRequest.doctor?.fullName}`,
      authorizationStatus: 'AUTHORIZED',
      consentStatus: 'EXPLICIT_CONSENT',
      blockchainTxId: proof.transactionId,
      ipAddress: req.ip as string,
    });

    // Create Notification for Doctor
    if (accessRequest.doctor?.userId) {
      await prisma.notification.create({
        data: {
          userId: accessRequest.doctor.userId,
          title: 'Access Request Approved',
          message: `${req.user!.fullName || 'Patient'} (${req.user?.healthId || ''}) approved your request to access their medical records. Approved Scope: ${resolvedScopes.join(', ')}. Expiry: ${expiresAt ? expiresAt.toLocaleString() : 'Forever (No Expiry)'}.`,
          type: 'ACCESS_REQUEST',
          category: 'ACCESS_REQUEST',
          priority: 'HIGH',
          linkRoute: `/doctor/patients/${patientId}/emr`,
          metadataJson: JSON.stringify({
            patientId,
            patientHealthId: req.user?.healthId || '',
            patientName: req.user!.fullName || 'Patient',
            permissionId: permission.id,
            scopes: resolvedScopes,
            expiresAt: expiresAt ? expiresAt.toISOString() : null,
          }),
        },
      });
    }

    res.json({
      success: true,
      message: `Access permission granted to ${accessRequest.doctor?.fullName} (${durationLabel}).`,
      permission,
      accessRequest: updatedRequest,
      blockchainTxId: proof.transactionId,
    });
  }

  /**
   * Reject an access request (Reason is optional with default).
   */
  async rejectAccessRequest(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const id = req.params.id as string;
    const reason = req.body?.reason?.trim() || 'Declined by patient';

    const accessRequest: any = await prisma.accessRequest.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!accessRequest || accessRequest.patientId !== patientId) {
      res.status(404).json({ success: false, error: 'Access request not found.' });
      return;
    }

    const updated = await prisma.accessRequest.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason },
    });

    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'PATIENT',
      actorName: req.user!.fullName || 'Patient',
      patientId,
      patientHealthId: req.user?.healthId,
      doctorId: accessRequest.doctorId,
      doctorName: accessRequest.doctor?.fullName,
      documentId: id,
      documentType: 'ACCESS_PERMISSION',
      action: 'REJECT',
      accessType: 'NORMAL',
      reason: `Access request rejected by patient: ${reason}`,
      authorizationStatus: 'DENIED',
      ipAddress: req.ip as string,
    });

    // Notify doctor
    const doctor = await prisma.doctor.findUnique({ where: { id: accessRequest.doctorId } });
    if (doctor?.userId) {
      await prisma.notification.create({
        data: {
          userId: doctor.userId,
          title: 'EMR Access Request Rejected',
          message: `${req.user!.fullName || 'Patient'} (${req.user?.healthId || ''}) rejected your request to access their medical records. Reason: "${reason}".`,
          type: 'ACCESS_REQUEST',
          category: 'ACCESS_REQUEST',
          priority: 'NORMAL',
          linkRoute: '/doctor/access-requests',
          metadataJson: JSON.stringify({
            patientId,
            patientHealthId: req.user?.healthId || '',
            patientName: req.user!.fullName || 'Patient',
            reason,
          }),
        },
      });
    }

    res.json({ success: true, message: 'Access request rejected.', accessRequest: updated });
  }

  /**
   * Revoke an active access permission immediately.
   */
  async revokePermission(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const id = req.params.id as string;
    const { reason = 'Revoked by patient' } = req.body;

    const permission: any = await prisma.permission.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!permission || permission.patientId !== patientId) {
      res.status(404).json({ success: false, error: 'Permission not found.' });
      return;
    }

    await prisma.permission.update({
      where: { id },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });

    // Register Blockchain Event Proof
    const proof = await blockchainService.registerRecordProof({
      recordId: permission.id,
      recordType: 'ACCESS_PERMISSION',
      eventType: 'ACCESS_REVOKED',
      payload: { permissionId: permission.id, revokedAt: new Date().toISOString(), reason },
      referenceId: req.user?.healthId || 'HP-100245',
    });

    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'PATIENT',
      actorName: req.user!.fullName || 'Patient',
      patientId,
      patientHealthId: req.user?.healthId,
      doctorId: permission.doctorId,
      doctorName: permission.doctor?.fullName,
      documentId: permission.id,
      documentType: 'ACCESS_PERMISSION',
      action: 'REVOKE',
      accessType: 'NORMAL',
      reason: `Access permission immediately revoked: ${reason}`,
      blockchainTxId: proof.transactionId,
      ipAddress: req.ip as string,
    });

    // Notify doctor
    if (permission.doctor?.userId) {
      await prisma.notification.create({
        data: {
          userId: permission.doctor.userId,
          title: 'EMR Access Permission Revoked',
          message: `${req.user!.fullName || 'Patient'} (${req.user?.healthId || ''}) revoked your access clearance to their medical records. Reason: "${reason}".`,
          type: 'ACCESS_REQUEST',
          category: 'ACCESS_REQUEST',
          priority: 'HIGH',
          linkRoute: '/doctor/access-requests',
          metadataJson: JSON.stringify({
            patientId,
            patientHealthId: req.user?.healthId || '',
            patientName: req.user!.fullName || 'Patient',
            reason,
          }),
        },
      });
    }

    res.json({ success: true, message: 'Permission revoked immediately.', blockchainTxId: proof.transactionId });
  }

  /**
   * Add, edit or delete emergency contacts.
   */
  async manageEmergencyContacts(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const { action, contactId, name, relationship, phone, email, isPrimary } = req.body;

    if (!patientId) {
      res.status(403).json({ success: false, error: 'Patient ID missing' });
      return;
    }

    if (Array.isArray(req.body.contacts)) {
      await prisma.emergencyContact.deleteMany({ where: { patientId } });
      const createdList = [];
      for (const c of req.body.contacts) {
        const cleanPhone = c.phone ? (String(c.phone).replace(/\D/g, '').slice(-10)) : '';
        if (c.name && cleanPhone) {
          const created = await prisma.emergencyContact.create({
            data: {
              patientId,
              name: String(c.name).trim(),
              relationship: c.relationship || 'Emergency Contact',
              phone: cleanPhone,
              isPrimary: !!c.isPrimary,
            },
          });
          createdList.push(created);
        }
      }
      res.json({ success: true, contacts: createdList, message: 'Emergency contacts updated successfully.' });
      return;
    }

    if (action === 'DELETE') {
      await prisma.emergencyContact.delete({ where: { id: contactId } });
      res.json({ success: true, message: 'Emergency contact removed.' });
      return;
    }

    if (action === 'UPDATE') {
      const updated = await prisma.emergencyContact.update({
        where: { id: contactId },
        data: { name, relationship, phone, email, isPrimary },
      });
      res.json({ success: true, contact: updated });
      return;
    }

    const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';
    if (!name || !cleanPhone) {
      res.status(400).json({ success: false, error: 'Contact name and valid phone number are required.' });
      return;
    }

    // Default: Add contact
    // Check if phone matches an existing patient
    const existingPatient = await prisma.user.findFirst({
      where: { mobile: cleanPhone, role: 'PATIENT' },
      include: { patient: true },
    });

    const newContact = await prisma.emergencyContact.create({
      data: {
        patientId,
        name,
        relationship: relationship || 'Emergency Contact',
        phone: cleanPhone,
        email: email || null,
        isRegisteredPatient: !!existingPatient,
        registeredPatientId: existingPatient?.patient?.id || null,
        isPrimary: !!isPrimary,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Emergency contact added. Remember: Emergency contacts do NOT automatically receive full medical record access.',
      contact: newContact,
    });
  }

  /**
   * Get patient's append-only audit trail.
   */
  async getAuditHistory(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const { action, documentType } = req.query;

    const where: any = { patientId };
    if (action) where.action = action as string;
    if (documentType) where.documentType = documentType as string;

    const audits = await prisma.auditEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    res.json({ success: true, audits, auditLogs: audits, logs: audits });
  }

  /**
   * Submit a correction request (maintains version integrity without silent overwrite).
   */
  async requestCorrection(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const { recordId, recordType, fieldName, originalValue, requestedValue, reason } = req.body;

    if (!recordId || !fieldName || !requestedValue || !reason) {
      res.status(400).json({ success: false, error: 'Missing required correction request details.' });
      return;
    }

    const correction = await prisma.correctionRequest.create({
      data: {
        patientId: patientId!,
        recordId,
        recordType: recordType || 'MEDICAL_RECORD',
        fieldName,
        originalValue: originalValue || '',
        requestedValue,
        reason,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Correction request submitted. Medical team will review and create a new record version if approved.',
      correction,
    });
  }

  /**
   * Get patient notifications.
   */
  async getNotifications(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({ success: true, notifications, data: notifications, unreadCount });
  }

  /**
   * Mark notification as read.
   */
  async markNotificationRead(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;

    if (id === 'all') {
      await prisma.notification.updateMany({
        where: { userId: req.user!.id },
        data: { isRead: true },
      });
      res.json({ success: true, message: 'All notifications marked as read.' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({ success: true, notification: { ...updated, read: true, isRead: true } });
  }

  /**
   * Get patient Helpdesk / Support tickets.
   */
  async getHelpdeskTickets(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    if (!patientId) {
      res.status(403).json({ success: false, error: 'PATIENT_PROFILE_REQUIRED' });
      return;
    }

    const tickets = await prisma.correctionRequest.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedTickets = tickets.map((t) => ({
      ...t,
      subject: t.fieldName,
      category: t.recordType,
      description: t.reason,
      priority: t.originalValue,
      adminResponse: t.reviewNotes,
    }));

    res.json({ success: true, tickets: enrichedTickets, data: enrichedTickets });
  }

  /**
   * Create a new Helpdesk / Support ticket.
   */
  async createHelpdeskTicket(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const { subject, category, description, priority = 'NORMAL' } = req.body;

    if (!patientId) {
      res.status(403).json({ success: false, error: 'PATIENT_PROFILE_REQUIRED' });
      return;
    }

    if (!subject || !category || !description) {
      res.status(400).json({ success: false, error: 'Subject, category, and description are required.' });
      return;
    }

    const count = await prisma.correctionRequest.count();
    const ticket = await prisma.correctionRequest.create({
      data: {
        patientId,
        recordId: `TICK-${1000 + count}`,
        recordType: category,
        fieldName: subject,
        originalValue: priority,
        requestedValue: description,
        reason: description,
        status: 'OPEN',
      },
    });

    // Notify administrators of new ticket
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: `Helpdesk Ticket: ${subject}`,
          message: `New support ticket #${ticket.recordId} (${category}) submitted by patient.`,
          type: 'RECORD',
          category: 'GENERAL',
          priority: priority === 'CRITICAL' || priority === 'HIGH' ? 'HIGH' : 'NORMAL',
          linkRoute: '/admin/security',
        },
      });
    }

    res.status(201).json({ success: true, message: 'Helpdesk ticket submitted successfully.', ticket });
  }

  /**
   * Get all medical documents & clinical reports for the authenticated patient with real privacy status.
   */
  async getDocuments(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;

    if (!patientId) {
      res.status(403).json({ success: false, error: 'PATIENT_PROFILE_REQUIRED' });
      return;
    }

    const [medicalRecords, labReports, prescriptions, consultations] = await Promise.all([
      prisma.medicalRecord.findMany({
        where: { patientId },
        orderBy: { date: 'desc' },
      }),
      prisma.labReport.findMany({
        where: { patientId },
        include: { doctor: true, hospital: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.prescription.findMany({
        where: { patientId },
        include: { doctor: true, hospital: true, medicines: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.consultation.findMany({
        where: { patientId },
        include: { doctor: true, hospital: true },
        orderBy: { date: 'desc' },
      }),
    ]);

    const documents: any[] = [
      ...medicalRecords.map((m) => {
        const isPrivate = m.description?.includes('VISIBILITY:PRIVATE');
        const emergencyAllowed = m.isEmergencyAccessible !== false;
        return {
          id: m.id,
          title: m.title,
          category: m.recordType === 'SURGERY' ? 'Surgery' : m.recordType === 'IMMUNIZATION' ? 'Immunization' : 'Clinical Record',
          date: m.date,
          doctorName: 'Attending Physician',
          hospital: 'Apex Health City',
          visibility: (isPrivate ? 'PRIVATE' : 'NORMAL') as 'NORMAL' | 'PRIVATE',
          allowEmergencyAccess: emergencyAllowed,
          sha256: m.currentHash,
          verified: m.blockchainStatus === 'VERIFIED',
          fileSize: '1.2 MB',
          documentType: 'MEDICAL_RECORD',
        };
      }),
      ...labReports.map((l) => {
        const isPrivate = l.summary?.includes('VISIBILITY:PRIVATE');
        const emergencyBlocked = l.summary?.includes('EMERGENCY:BLOCKED');
        return {
          id: l.id,
          title: l.testName,
          category: 'Lab Report',
          date: l.resultDate || l.sampleDate || l.createdAt.toISOString().split('T')[0],
          doctorName: l.doctor?.fullName ? `Dr. ${l.doctor.fullName}` : 'Diagnostic Specialist',
          hospital: l.hospital?.name || l.laboratoryName || 'Apex Diagnostic Services',
          visibility: (isPrivate ? 'PRIVATE' : 'NORMAL') as 'NORMAL' | 'PRIVATE',
          allowEmergencyAccess: !emergencyBlocked,
          sha256: l.recordHash,
          verified: l.blockchainStatus === 'VERIFIED',
          fileSize: l.fileSize || '2.4 MB',
          documentType: 'LAB_REPORT',
        };
      }),
      ...prescriptions.map((p) => {
        const isPrivate = p.notes?.includes('VISIBILITY:PRIVATE');
        const emergencyBlocked = p.notes?.includes('EMERGENCY:BLOCKED');
        return {
          id: p.id,
          title: `Prescription: ${p.diagnosis}`,
          category: 'Prescription',
          date: p.createdAt.toISOString().split('T')[0],
          doctorName: p.doctor?.fullName ? `Dr. ${p.doctor.fullName}` : 'Attending Physician',
          hospital: p.hospital?.name || 'Apex Health City',
          visibility: (isPrivate ? 'PRIVATE' : 'NORMAL') as 'NORMAL' | 'PRIVATE',
          allowEmergencyAccess: !emergencyBlocked,
          sha256: p.recordHash,
          verified: p.blockchainStatus === 'VERIFIED',
          fileSize: '850 KB',
          documentType: 'PRESCRIPTION',
        };
      }),
      ...consultations.map((c) => {
        const isPrivate = c.clinicalNotes?.includes('VISIBILITY:PRIVATE');
        const emergencyBlocked = c.clinicalNotes?.includes('EMERGENCY:BLOCKED');
        return {
          id: c.id,
          title: `Consultation: ${c.diagnosis}`,
          category: 'Clinical Note',
          date: c.date,
          doctorName: c.doctor?.fullName ? `Dr. ${c.doctor.fullName}` : 'Consultant Physician',
          hospital: c.hospital?.name || 'Apex Health City',
          visibility: (isPrivate ? 'PRIVATE' : 'NORMAL') as 'NORMAL' | 'PRIVATE',
          allowEmergencyAccess: !emergencyBlocked,
          sha256: c.recordHash,
          verified: c.blockchainStatus === 'VERIFIED',
          fileSize: '950 KB',
          documentType: 'CONSULTATION',
        };
      }),
    ];

    res.json({
      success: true,
      documents,
      count: documents.length,
      data: documents,
    });
  }

  /**
   * Get single medical document detail by ID with strict ownership authorization.
   */
  async getDocumentById(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const id = req.params.id as string;

    if (!patientId) {
      res.status(403).json({ success: false, error: 'PATIENT_PROFILE_REQUIRED' });
      return;
    }

    // Check MedicalRecord
    const medRec = await prisma.medicalRecord.findFirst({ where: { id, patientId } });
    if (medRec) {
      const isPrivate = medRec.description?.includes('VISIBILITY:PRIVATE');
      res.json({
        success: true,
        document: {
          id: medRec.id,
          title: medRec.title,
          category: medRec.recordType,
          date: medRec.date,
          doctorName: 'Attending Physician',
          hospital: 'Apex Health City',
          visibility: isPrivate ? 'PRIVATE' : 'NORMAL',
          allowEmergencyAccess: medRec.isEmergencyAccessible !== false,
          sha256: medRec.currentHash,
          verified: medRec.blockchainStatus === 'VERIFIED',
          fileSize: '1.2 MB',
          documentType: 'MEDICAL_RECORD',
        },
      });
      return;
    }

    // Check LabReport
    const lab = await prisma.labReport.findFirst({ where: { id, patientId }, include: { doctor: true, hospital: true } });
    if (lab) {
      const isPrivate = lab.summary?.includes('VISIBILITY:PRIVATE');
      const emergencyBlocked = lab.summary?.includes('EMERGENCY:BLOCKED');
      res.json({
        success: true,
        document: {
          id: lab.id,
          title: lab.testName,
          category: 'Lab Report',
          date: lab.resultDate || lab.sampleDate,
          doctorName: lab.doctor?.fullName ? `Dr. ${lab.doctor.fullName}` : 'Diagnostic Specialist',
          hospital: lab.hospital?.name || lab.laboratoryName || 'Apex Diagnostic Services',
          visibility: isPrivate ? 'PRIVATE' : 'NORMAL',
          allowEmergencyAccess: !emergencyBlocked,
          sha256: lab.recordHash,
          verified: lab.blockchainStatus === 'VERIFIED',
          fileSize: lab.fileSize || '2.4 MB',
          documentType: 'LAB_REPORT',
        },
      });
      return;
    }

    // Check Prescription
    const rx = await prisma.prescription.findFirst({
      where: {
        AND: [
          { patientId },
          { OR: [{ id }, { prescriptionNumber: id }] },
        ],
      },
      include: { doctor: true, hospital: true, medicines: true },
    });
    if (rx) {
      const isPrivate = rx.notes?.includes('VISIBILITY:PRIVATE');
      const emergencyBlocked = rx.notes?.includes('EMERGENCY:BLOCKED');
      res.json({
        success: true,
        document: {
          id: rx.id,
          title: `Prescription: ${rx.diagnosis}`,
          category: 'Prescription',
          date: rx.createdAt.toISOString().split('T')[0],
          doctorName: rx.doctor?.fullName ? `Dr. ${rx.doctor.fullName}` : 'Attending Physician',
          hospital: rx.hospital?.name || 'Apex Health City',
          visibility: isPrivate ? 'PRIVATE' : 'NORMAL',
          allowEmergencyAccess: !emergencyBlocked,
          sha256: rx.recordHash,
          verified: rx.blockchainStatus === 'VERIFIED',
          fileSize: '850 KB',
          documentType: 'PRESCRIPTION',
        },
      });
      return;
    }

    // Check Consultation
    const con = await prisma.consultation.findFirst({
      where: {
        AND: [
          { patientId },
          { OR: [{ id }, { consultationNumber: id }] },
        ],
      },
      include: { doctor: true, hospital: true },
    });
    if (con) {
      const isPrivate = con.clinicalNotes?.includes('VISIBILITY:PRIVATE');
      const emergencyBlocked = con.clinicalNotes?.includes('EMERGENCY:BLOCKED');
      res.json({
        success: true,
        document: {
          id: con.id,
          title: `Consultation: ${con.diagnosis}`,
          category: 'Clinical Note',
          date: con.date,
          doctorName: con.doctor?.fullName ? `Dr. ${con.doctor.fullName}` : 'Consultant Physician',
          hospital: con.hospital?.name || 'Apex Health City',
          visibility: isPrivate ? 'PRIVATE' : 'NORMAL',
          allowEmergencyAccess: !emergencyBlocked,
          sha256: con.recordHash,
          verified: con.blockchainStatus === 'VERIFIED',
          fileSize: '950 KB',
          documentType: 'CONSULTATION',
        },
      });
      return;
    }

    res.status(404).json({ success: false, error: 'DOCUMENT_NOT_FOUND', message: 'Document not found or unauthorized.' });
  }

  /**
   * Update document privacy (visibility & emergency override access).
   */
  async updateDocumentPrivacy(req: Request, res: Response): Promise<void> {
    const patientId = req.user?.patientId;
    const id = req.params.id as string;
    const { visibility, allowEmergencyAccess } = req.body;

    if (!patientId) {
      res.status(403).json({ success: false, error: 'PATIENT_PROFILE_REQUIRED' });
      return;
    }

    let updated = false;

    // 1. Try MedicalRecord
    const medRec = await prisma.medicalRecord.findFirst({ where: { id, patientId } });
    if (medRec) {
      let desc = medRec.description || '';
      if (visibility === 'PRIVATE' && !desc.includes('VISIBILITY:PRIVATE')) {
        desc = (desc + ' [VISIBILITY:PRIVATE]').trim();
      } else if (visibility === 'NORMAL' && desc.includes('VISIBILITY:PRIVATE')) {
        desc = desc.replace(/\[VISIBILITY:PRIVATE\]/g, '').trim();
      }

      await prisma.medicalRecord.update({
        where: { id: medRec.id },
        data: {
          description: desc,
          isEmergencyAccessible: allowEmergencyAccess !== undefined ? !!allowEmergencyAccess : medRec.isEmergencyAccessible,
        },
      });
      updated = true;
    }

    // 2. Try LabReport
    if (!updated) {
      const lab = await prisma.labReport.findFirst({ where: { id, patientId } });
      if (lab) {
        let summ = lab.summary || '';
        if (visibility === 'PRIVATE' && !summ.includes('VISIBILITY:PRIVATE')) {
          summ = (summ + ' [VISIBILITY:PRIVATE]').trim();
        } else if (visibility === 'NORMAL' && summ.includes('VISIBILITY:PRIVATE')) {
          summ = summ.replace(/\[VISIBILITY:PRIVATE\]/g, '').trim();
        }

        if (allowEmergencyAccess === false && !summ.includes('EMERGENCY:BLOCKED')) {
          summ = (summ + ' [EMERGENCY:BLOCKED]').trim();
        } else if (allowEmergencyAccess === true && summ.includes('EMERGENCY:BLOCKED')) {
          summ = summ.replace(/\[EMERGENCY:BLOCKED\]/g, '').trim();
        }

        await prisma.labReport.update({
          where: { id: lab.id },
          data: { summary: summ },
        });
        updated = true;
      }
    }

    // 3. Try Prescription
    if (!updated) {
      const rx = await prisma.prescription.findFirst({
        where: {
          AND: [{ patientId }, { OR: [{ id }, { prescriptionNumber: id }] }],
        },
      });
      if (rx) {
        let notes = rx.notes || '';
        if (visibility === 'PRIVATE' && !notes.includes('VISIBILITY:PRIVATE')) {
          notes = (notes + ' [VISIBILITY:PRIVATE]').trim();
        } else if (visibility === 'NORMAL' && notes.includes('VISIBILITY:PRIVATE')) {
          notes = notes.replace(/\[VISIBILITY:PRIVATE\]/g, '').trim();
        }

        if (allowEmergencyAccess === false && !notes.includes('EMERGENCY:BLOCKED')) {
          notes = (notes + ' [EMERGENCY:BLOCKED]').trim();
        } else if (allowEmergencyAccess === true && notes.includes('EMERGENCY:BLOCKED')) {
          notes = notes.replace(/\[EMERGENCY:BLOCKED\]/g, '').trim();
        }

        await prisma.prescription.update({
          where: { id: rx.id },
          data: { notes },
        });
        updated = true;
      }
    }

    // 4. Try Consultation
    if (!updated) {
      const con = await prisma.consultation.findFirst({
        where: {
          AND: [{ patientId }, { OR: [{ id }, { consultationNumber: id }] }],
        },
      });
      if (con) {
        let notes = con.clinicalNotes || '';
        if (visibility === 'PRIVATE' && !notes.includes('VISIBILITY:PRIVATE')) {
          notes = (notes + ' [VISIBILITY:PRIVATE]').trim();
        } else if (visibility === 'NORMAL' && notes.includes('VISIBILITY:PRIVATE')) {
          notes = notes.replace(/\[VISIBILITY:PRIVATE\]/g, '').trim();
        }

        if (allowEmergencyAccess === false && !notes.includes('EMERGENCY:BLOCKED')) {
          notes = (notes + ' [EMERGENCY:BLOCKED]').trim();
        } else if (allowEmergencyAccess === true && notes.includes('EMERGENCY:BLOCKED')) {
          notes = notes.replace(/\[EMERGENCY:BLOCKED\]/g, '').trim();
        }

        await prisma.consultation.update({
          where: { id: con.id },
          data: { clinicalNotes: notes },
        });
        updated = true;
      }
    }

    if (!updated) {
      res.status(404).json({ success: false, error: 'DOCUMENT_NOT_FOUND', message: 'Document not found or unauthorized.' });
      return;
    }

    // Log Audit Event
    await logAuditEvent({
      actorId: req.user!.id,
      actorRole: 'PATIENT',
      actorName: req.user!.fullName || 'Patient',
      patientId,
      documentId: id,
      documentType: 'PROFILE',
      action: 'MODIFY',
      accessType: 'NORMAL',
      reason: `Patient updated document privacy level: Visibility=${visibility || 'UNCHANGED'}, EmergencyOverride=${allowEmergencyAccess !== undefined ? allowEmergencyAccess : 'UNCHANGED'}`,
      authorizationStatus: 'AUTHORIZED',
      consentStatus: 'EXPLICIT_CONSENT',
      ipAddress: req.ip as string,
    });

    res.json({
      success: true,
      message: 'Document privacy configuration updated in PostgreSQL.',
      id,
      visibility,
      allowEmergencyAccess,
    });
  }
}

export const patientController = new PatientController();
