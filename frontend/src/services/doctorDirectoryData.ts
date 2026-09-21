import { appointmentBookingService } from './appointmentBookingService';

export interface DoctorDirectoryItem {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  qualifications: string;
  licenseNumber: string;
  council: string;
  experienceYears: number;
  hospital: string;
  hospitalId?: string;
  department: string;
  rating: number;
  availableSlot: string;
  isVerified: boolean;
  bio: string;
  photoUrl: string;
  appointmentRoute: string;
  appointmentUrl: string;
  consultationFee: string;
  appointmentBookingLink?: string | null;
}

/**
 * Map raw database doctor object from PostgreSQL to DoctorDirectoryItem
 */
export function mapDbDoctorToDirectoryItem(d: any): DoctorDirectoryItem {
  const hospitalName = d.hospitalAffiliation || d.affiliations?.[0]?.hospital?.name || 'Apex Health City';
  const hospitalId = d.affiliations?.[0]?.hospital?.id || undefined;
  const fullName = d.fullName?.startsWith('Dr.') ? d.fullName : `Dr. ${d.fullName || 'Specialist'}`;
  const spec = d.specialization || 'General Medicine';
  const exp = d.experienceYears || 5;

  const item: DoctorDirectoryItem = {
    id: d.id,
    slug: d.id,
    name: fullName,
    specialty: spec,
    qualifications: d.qualifications || 'MBBS',
    licenseNumber: d.registrationNumber || 'TSMC-Verified',
    council: d.registrationState ? `${d.registrationState} Medical Council` : 'State Medical Council',
    experienceYears: exp,
    hospital: hospitalName,
    hospitalId,
    department: d.department || `Department of ${spec}`,
    rating: 4.9,
    availableSlot: 'Next Available: 09:00 AM',
    isVerified: d.regStatus === 'APPROVED',
    bio: `Accredited specialist in ${spec} with ${exp}+ years of clinical experience. Licensed under Medical Council.`,
    photoUrl: d.profilePhoto || '',
    appointmentRoute: `/patient/appointments/book?doctor=${encodeURIComponent(d.id)}`,
    appointmentUrl: `/patient/appointments/book?doctor=${encodeURIComponent(d.id)}`,
    consultationFee: '₹850',
    appointmentBookingLink: null,
  };

  return getDoctorWithBookingLink(item);
}

/**
 * Get active doctor item with dynamic appointment booking link if set
 */
export function getDoctorWithBookingLink(doctor: DoctorDirectoryItem): DoctorDirectoryItem {
  if (!doctor) return doctor;
  const savedLink = appointmentBookingService.getDoctorBookingLink(doctor.id, doctor.name);
  return {
    ...doctor,
    appointmentBookingLink: savedLink || doctor.appointmentBookingLink || null,
  };
}
