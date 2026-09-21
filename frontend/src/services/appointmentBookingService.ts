/**
 * Appointment Booking Service (Apex EMR)
 *
 * Manages:
 * 1. Doctor-specific official booking links (Doctor Profile)
 * 2. Doctor schedules & real-time slot availability
 * 3. Appointment creation, storage (localStorage), and double-booking prevention
 * 4. Dual-sync for Patient Appointments & Doctor Appointments
 */

export type AppointmentType = 'IN_PERSON' | 'TELEMEDICINE';
export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface StoredAppointment {
  id: string; // e.g. "APT-100245"
  patientId: string;
  patientName: string;
  patientHealthId: string;
  doctorId: string;
  doctorName: string;
  doctorPhoto?: string;
  specialization: string;
  hospitalId?: string;
  hospitalName: string;
  date: string; // "2026-09-28"
  time: string; // "11:00 AM"
  type: AppointmentType;
  reason?: string;
  status: AppointmentStatus;
  room?: string;
  tokenNumber?: string;
  instructions?: string;
  hasOpdPass: boolean;
  createdAt: string;
}

export interface DoctorScheduleSlot {
  time: string;
  isBooked: boolean;
}

export interface AvailableDateOption {
  date: string; // "2026-09-28"
  label: string; // "Mon, 28 Sep"
  dayName: string; // "Monday"
  hasAvailableSlots: boolean;
}

const STORAGE_KEYS = {
  BOOKING_LINKS: 'apex_emr_doctor_booking_links',
  APPOINTMENTS: 'apex_emr_appointments',
};

// Standard slot times available per working day
const DEFAULT_DAILY_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '04:00 PM',
];

// Seed dates for next available schedule
const SEED_DATES: AvailableDateOption[] = [
  { date: '2026-09-28', label: 'Mon, 28 Sep 2026', dayName: 'Monday', hasAvailableSlots: true },
  { date: '2026-09-29', label: 'Tue, 29 Sep 2026', dayName: 'Tuesday', hasAvailableSlots: true },
  { date: '2026-09-30', label: 'Wed, 30 Sep 2026', dayName: 'Wednesday', hasAvailableSlots: true },
  { date: '2026-10-01', label: 'Thu, 01 Oct 2026', dayName: 'Thursday', hasAvailableSlots: true },
  { date: '2026-10-02', label: 'Fri, 02 Oct 2026', dayName: 'Friday', hasAvailableSlots: true },
  { date: '2026-10-05', label: 'Mon, 05 Oct 2026', dayName: 'Monday', hasAvailableSlots: true },
];

// Initial appointments (empty by default for real database data)
const INITIAL_APPOINTMENTS: StoredAppointment[] = [];

class AppointmentBookingService {
  /**
   * Helper to normalize doctor key
   */
  private normalizeDoctorKey(doctorIdOrName: string): string {
    const raw = doctorIdOrName.toLowerCase().trim();
    if (raw.includes('ananya') || raw === 'doc-1' || raw === 'doc-20481') return 'doc-1';
    if (raw.includes('verma') || raw === 'doc-2' || raw === 'doc-20981') return 'doc-2';
    if (raw.includes('nair') || raw === 'doc-3' || raw === 'doc-20512') return 'doc-3';
    return raw;
  }

  // ==================================================
  // 1. DOCTOR OFFICIAL BOOKING LINK MANAGEMENT
  // ==================================================

  /**
   * Get doctor's saved official appointment booking link
   */
  getDoctorBookingLink(doctorIdOrName: string, fallbackName?: string): string | null {
    try {
      const key = this.normalizeDoctorKey(doctorIdOrName || fallbackName || '');
      const links = this.getAllBookingLinks();
      const link = links[key];
      return link ? link.trim() : null;
    } catch {
      return null;
    }
  }

  /**
   * Set or update doctor's official appointment booking link
   */
  setDoctorBookingLink(doctorIdOrName: string, url: string | null): void {
    const key = this.normalizeDoctorKey(doctorIdOrName);
    const links = this.getAllBookingLinks();

    if (!url || !url.trim()) {
      delete links[key];
    } else {
      links[key] = url.trim();
    }

    try {
      localStorage.setItem(STORAGE_KEYS.BOOKING_LINKS, JSON.stringify(links));
      // Dispatch storage event so other components immediately know
      window.dispatchEvent(new CustomEvent('apex_booking_link_updated', { detail: { doctorKey: key, url } }));
    } catch (e) {
      console.error('Failed to save booking link to localStorage', e);
    }
  }

  /**
   * Validate official booking URL
   */
  validateBookingLink(url: string): { isValid: boolean; error?: string } {
    const trimmed = (url || '').trim();
    if (!trimmed) {
      return { isValid: false, error: 'Appointment link cannot be empty.' };
    }

    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('file:') ||
      lower.startsWith('vbscript:')
    ) {
      return { isValid: false, error: 'Insecure URL protocol rejected. Only http:// or https:// links are permitted.' };
    }

    if (!lower.startsWith('http://') && !lower.startsWith('https://')) {
      return { isValid: false, error: 'Link must start with http:// or https://' };
    }

    try {
      new URL(trimmed);
      return { isValid: true };
    } catch {
      return { isValid: false, error: 'Please enter a valid, well-formed web URL.' };
    }
  }

  private getAllBookingLinks(): Record<string, string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BOOKING_LINKS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  }

  // ==================================================
  // 2. DOCTOR SCHEDULE & SLOTS
  // ==================================================

  /**
   * Get available booking dates for doctor
   */
  getDoctorAvailableDates(doctorIdOrName: string): AvailableDateOption[] {
    const key = this.normalizeDoctorKey(doctorIdOrName);
    return SEED_DATES.map((d) => {
      const slots = this.getDoctorSlotsForDate(key, d.date);
      const hasAvailable = slots.some((s) => !s.isBooked);
      return {
        ...d,
        hasAvailableSlots: hasAvailable,
      };
    });
  }

  /**
   * Get all time slots for a doctor on a specific date, indicating if booked
   */
  getDoctorSlotsForDate(doctorIdOrName: string, date: string): DoctorScheduleSlot[] {
    const key = this.normalizeDoctorKey(doctorIdOrName);
    const appointments = this.getAllAppointments();

    // Find all scheduled bookings for this doctor on this date
    const bookedTimes = new Set(
      appointments
        .filter((apt) => {
          const aptDocKey = this.normalizeDoctorKey(apt.doctorId || apt.doctorName);
          return (
            aptDocKey === key &&
            apt.date === date &&
            apt.status === 'SCHEDULED'
          );
        })
        .map((apt) => apt.time.trim())
    );

    return DEFAULT_DAILY_SLOTS.map((slotTime) => ({
      time: slotTime,
      isBooked: bookedTimes.has(slotTime),
    }));
  }

  /**
   * Check if a specific slot is available
   */
  isSlotAvailable(doctorIdOrName: string, date: string, time: string): boolean {
    const slots = this.getDoctorSlotsForDate(doctorIdOrName, date);
    const target = slots.find((s) => s.time === time);
    return !!target && !target.isBooked;
  }

  /**
   * Prevent duplicate booking by the same patient for the same doctor/date/time
   */
  hasPatientDoubleBooked(patientHealthId: string, doctorIdOrName: string, date: string, time: string): boolean {
    const key = this.normalizeDoctorKey(doctorIdOrName);
    const appointments = this.getAllAppointments();

    return appointments.some((apt) => {
      const aptDocKey = this.normalizeDoctorKey(apt.doctorId || apt.doctorName);
      return (
        apt.patientHealthId === patientHealthId &&
        aptDocKey === key &&
        apt.date === date &&
        apt.time === time &&
        apt.status === 'SCHEDULED'
      );
    });
  }

  // ==================================================
  // 3. APPOINTMENT BOOKING & CREATION
  // ==================================================

  /**
   * Book an appointment with double-booking prevention
   */
  bookAppointment(params: {
    patientId?: string;
    patientName?: string;
    patientHealthId?: string;
    doctorId: string;
    doctorName: string;
    doctorPhoto?: string;
    specialization: string;
    hospitalId?: string;
    hospitalName: string;
    date: string;
    time: string;
    type: AppointmentType;
    reason?: string;
  }): { success: boolean; appointment?: StoredAppointment; error?: string } {
    const docKey = this.normalizeDoctorKey(params.doctorId || params.doctorName);
    const patientHealthId = params.patientHealthId || '';
    const patientName = params.patientName || 'Patient';

    // 1. Check double booking on the doctor slot
    if (!this.isSlotAvailable(docKey, params.date, params.time)) {
      return {
        success: false,
        error: 'Sorry, this time slot is no longer available.',
      };
    }

    // 2. Check patient double booking
    if (patientHealthId && this.hasPatientDoubleBooked(patientHealthId, docKey, params.date, params.time)) {
      return {
        success: false,
        error: 'You already have an appointment booked with this doctor for this date and time slot.',
      };
    }

    // Generate room and token details
    const isVerma = params.doctorName.includes('Verma');
    const isNair = params.doctorName.includes('Nair');
    const room = isVerma
      ? 'Room 304, Diagnostic Block B'
      : isNair
      ? 'Suite 201, Dermatology Clinic'
      : 'Cardiology Suite 12, Main Building';

    const slotNum = Math.floor(3 + Math.random() * 8);
    const tokenNumber = `Slot #${slotNum} (Token #0${slotNum})`;

    const newAppointment: StoredAppointment = {
      id: `APT-${Math.floor(100000 + Math.random() * 900000)}`,
      patientId: params.patientId || 'patient-user',
      patientName,
      patientHealthId,
      doctorId: params.doctorId || docKey,
      doctorName: params.doctorName,
      doctorPhoto: params.doctorPhoto,
      specialization: params.specialization,
      hospitalId: params.hospitalId,
      hospitalName: params.hospitalName,
      date: params.date,
      time: params.time,
      type: params.type,
      reason: params.reason || `Clinical consultation with ${params.specialization} specialist.`,
      status: 'SCHEDULED',
      room,
      tokenNumber,
      instructions:
        params.type === 'IN_PERSON'
          ? 'Please report to OPD triage desk 15 minutes before your time slot.'
          : 'A secure video consultation link will be activated in your portal 10 minutes prior.',
      hasOpdPass: params.type === 'IN_PERSON',
      createdAt: new Date().toISOString(),
    };

    const all = [newAppointment, ...this.getAllAppointments()];
    this.saveAllAppointments(all);

    return {
      success: true,
      appointment: newAppointment,
    };
  }

  // ==================================================
  // 4. RETRIEVAL & SYNC
  // ==================================================

  /**
   * Get appointments for patient
   */
  getPatientAppointments(healthId?: string): StoredAppointment[] {
    if (!healthId) return [];
    const all = this.getAllAppointments();
    return all.filter((apt) => apt.patientHealthId === healthId);
  }

  /**
   * Get appointments for doctor
   */
  getDoctorAppointments(doctorIdOrName: string = 'doc-1'): StoredAppointment[] {
    const docKey = this.normalizeDoctorKey(doctorIdOrName);
    const all = this.getAllAppointments();
    return all.filter((apt) => {
      const aptKey = this.normalizeDoctorKey(apt.doctorId || apt.doctorName);
      return aptKey === docKey;
    });
  }

  /**
   * Cancel an appointment
   */
  cancelAppointment(id: string): boolean {
    const all = this.getAllAppointments();
    let found = false;
    const updated = all.map((apt) => {
      if (apt.id === id) {
        found = true;
        return { ...apt, status: 'CANCELLED' as AppointmentStatus };
      }
      return apt;
    });
    if (found) {
      this.saveAllAppointments(updated);
    }
    return found;
  }

  private getAllAppointments(): StoredAppointment[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      if (raw) {
        const parsed: StoredAppointment[] = JSON.parse(raw);
        return parsed.filter((apt) => apt.patientName !== 'Rahul Sharma' && apt.patientId !== 'pat_rahul_01');
      }
    } catch {}

    return [];
  }

  private saveAllAppointments(list: StoredAppointment[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('apex_appointments_updated'));
    } catch (e) {
      console.error('Failed to save appointments to localStorage', e);
    }
  }
}

export const appointmentBookingService = new AppointmentBookingService();
