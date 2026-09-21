import { Router } from 'express';
import { prisma } from '../models/prisma.js';
import { blockchainService } from '../services/blockchain.service.js';

const router = Router();

const RESERVED_DOCTOR_SUBPATHS = new Set([
  'dashboard',
  'profile',
  'settings',
  'audit',
  'notifications',
  'me',
  'appointments',
  'patients',
  'access-requests',
  'active-patients',
  'authorized-patients',
  'consultations',
  'prescriptions',
  'lab-reports',
  'emergency',
]);

/**
 * Public Hospital Directory
 */
router.get('/hospitals', async (req, res) => {
  try {
    const { city, specialty } = req.query;

    const hospitals = await prisma.hospital.findMany({
      where: {
        status: 'ACTIVE',
        ...(city ? { city: { equals: city as string, mode: 'insensitive' } } : {}),
        ...(specialty
          ? {
              departments: {
                some: { name: { contains: specialty as string, mode: 'insensitive' } },
              },
            }
          : {}),
      },
      include: {
        departments: true,
        doctorAffiliations: {
          where: { status: 'ACTIVE' },
          include: { doctor: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, hospitals });
  } catch (err: any) {
    console.error('Error fetching hospitals directory:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch hospitals directory.' });
  }
});

/**
 * Public Doctor Directory (Only APPROVED verified doctors)
 */
router.get('/doctors', async (req, res) => {
  try {
    const { specialization, hospital, search } = req.query;

    const where: any = {
      regStatus: 'APPROVED',
    };

    if (specialization) {
      where.specialization = { contains: specialization as string, mode: 'insensitive' };
    }

    if (hospital) {
      where.OR = [
        { hospitalAffiliation: { contains: hospital as string, mode: 'insensitive' } },
        { affiliations: { some: { hospital: { name: { contains: hospital as string, mode: 'insensitive' } } } } },
      ];
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
        { hospitalAffiliation: { contains: search, mode: 'insensitive' } },
        { affiliations: { some: { hospital: { name: { contains: search, mode: 'insensitive' } } } } },
      ];
    }

    const rawDoctors = await prisma.doctor.findMany({
      where,
      include: {
        affiliations: { 
          where: { status: 'ACTIVE' },
          include: { hospital: true } 
        },
      },
      orderBy: { experienceYears: 'desc' },
    });

    // Normalize by canonical doctor ID to guarantee no duplicate doctor objects
    const doctorMap = new Map<string, typeof rawDoctors[0]>();
    for (const doc of rawDoctors) {
      if (!doctorMap.has(doc.id)) {
        doctorMap.set(doc.id, doc);
      }
    }

    const doctors = Array.from(doctorMap.values());

    res.json({ success: true, doctors });
  } catch (err: any) {
    console.error('Error fetching doctors directory:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch doctors directory.' });
  }
});

/**
 * Public Doctor By ID (Only APPROVED verified doctor)
 */
router.get('/doctors/:id', async (req, res, next) => {
  const { id } = req.params;

  // Pass through if the route parameter matches a reserved doctor portal action
  if (RESERVED_DOCTOR_SUBPATHS.has(id)) {
    return next();
  }

  try {
    const doctor = await prisma.doctor.findFirst({
      where: {
        id,
        regStatus: 'APPROVED',
      },
      include: {
        affiliations: { 
          where: { status: 'ACTIVE' },
          include: { hospital: true } 
        },
      },
    });

    if (!doctor) {
      res.status(404).json({ success: false, error: 'Doctor not found or not approved.' });
      return;
    }

    res.json({ success: true, doctor });
  } catch (err: any) {
    console.error('Error fetching doctor by id:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch doctor details.' });
  }
});

/**
 * Public Doctor Booked Slots for a specific date
 */
router.get('/doctors/:id/booked-slots', async (req, res, next) => {
  const { id } = req.params;
  const { date } = req.query;

  if (RESERVED_DOCTOR_SUBPATHS.has(id)) {
    return next();
  }

  if (!date || typeof date !== 'string') {
    res.status(400).json({ success: false, error: 'Date query parameter is required.' });
    return;
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: id,
        date,
        status: { not: 'CANCELLED' },
      },
      select: { timeSlot: true },
    });

    const bookedSlots = appointments.map((a) => a.timeSlot);
    res.json({ success: true, bookedSlots });
  } catch (err: any) {
    console.error('Error fetching booked slots:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch booked slots.' });
  }
});

/**
 * Public Blockchain Network Status
 */
router.get('/blockchain/status', async (req, res) => {
  try {
    const status = await blockchainService.getStatus();
    res.json({ success: true, status });
  } catch (err: any) {
    console.error('Error fetching blockchain status:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch blockchain status.' });
  }
});

export default router;
