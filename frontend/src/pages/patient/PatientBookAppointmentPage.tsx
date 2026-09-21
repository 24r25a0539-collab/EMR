import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  Video,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  AlertTriangle,
} from 'lucide-react';
import { BackButton } from '../../components/common/BackButton';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ScrollReveal } from '../../components/common/ScrollReveal';
import {
  DoctorDirectoryItem,
  mapDbDoctorToDirectoryItem,
} from '../../services/doctorDirectoryData';
import api from '../../services/api';

const STANDARD_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
];

interface DateOption {
  date: string;
  label: string;
  dayName: string;
  formattedDay: string;
  formattedMonth: string;
}

export const PatientBookAppointmentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { t, localizeValue } = useLanguage();

  const doctorParam = searchParams.get('doctor');

  // Selected doctor state
  const [doctor, setDoctor] = useState<DoctorDirectoryItem | null>(() => {
    if (location.state?.doctor && location.state.doctor.id) {
      return location.state.doctor as DoctorDirectoryItem;
    }
    return null;
  });
  const [doctorLoading, setDoctorLoading] = useState<boolean>(!doctor);

  useEffect(() => {
    if (doctor) return;

    if (!doctorParam) {
      navigate('/patient/doctors', { replace: true });
      return;
    }

    let isMounted = true;
    const loadDoctor = async () => {
      try {
        setDoctorLoading(true);
        const res = await api.getDoctorById(doctorParam);
        if (res && res.success && res.doctor) {
          if (isMounted) {
            setDoctor(mapDbDoctorToDirectoryItem(res.doctor));
          }
        } else {
          const dirRes = await api.getDoctorsDirectory(doctorParam);
          if (dirRes && dirRes.success && Array.isArray(dirRes.doctors) && dirRes.doctors.length > 0) {
            if (isMounted) {
              setDoctor(mapDbDoctorToDirectoryItem(dirRes.doctors[0]));
            }
          } else {
            addToast('error', 'Doctor not found. Please select a verified doctor from the directory.');
            navigate('/patient/doctors', { replace: true });
          }
        }
      } catch (err) {
        console.error('Failed to load doctor details:', err);
        addToast('error', 'Doctor not found. Please select a verified doctor from the directory.');
        navigate('/patient/doctors', { replace: true });
      } finally {
        if (isMounted) setDoctorLoading(false);
      }
    };

    loadDoctor();
    return () => { isMounted = false; };
  }, [doctor, doctorParam, navigate, addToast]);

  const availableDates: DateOption[] = useMemo(() => {
    const dates: DateOption[] = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const label = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      const formattedDay = day;
      const formattedMonth = d.toLocaleDateString('en-US', { month: 'short' });

      dates.push({
        date: dateStr,
        label,
        dayName,
        formattedDay,
        formattedMonth,
      });
    }
    return dates;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(() => availableDates[0]?.date || '');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [slotsRefreshKey, setSlotsRefreshKey] = useState<number>(0);

  useEffect(() => {
    if (!doctor?.id || !selectedDate) return;

    let isMounted = true;
    const fetchBookedSlots = async () => {
      try {
        setSlotsLoading(true);
        const res = await api.getDoctorBookedSlots(doctor.id, selectedDate);
        if (res && res.success && Array.isArray(res.bookedSlots)) {
          if (isMounted) setBookedSlots(res.bookedSlots);
        } else {
          if (isMounted) setBookedSlots([]);
        }
      } catch (err) {
        console.error('Failed to fetch booked slots:', err);
        if (isMounted) setBookedSlots([]);
      } finally {
        if (isMounted) setSlotsLoading(false);
      }
    };

    fetchBookedSlots();
    return () => { isMounted = false; };
  }, [doctor?.id, selectedDate, slotsRefreshKey]);

  const [selectedTime, setSelectedTime] = useState<string>('');

  useEffect(() => {
    const firstAvailable = STANDARD_SLOTS.find((s) => !bookedSlots.includes(s));
    if (firstAvailable) {
      setSelectedTime(firstAvailable);
    } else {
      setSelectedTime('');
    }
  }, [bookedSlots, selectedDate]);

  const [appointmentType, setAppointmentType] = useState<'IN_PERSON' | 'TELEMEDICINE'>('IN_PERSON');
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookedAppointment, setBookedAppointment] = useState<any | null>(null);

  const displayDateText = useMemo(() => {
    const target = availableDates.find((d) => d.date === selectedDate);
    return target ? target.label : selectedDate;
  }, [availableDates, selectedDate]);

  const handleConfirmAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);

    if (!doctor) {
      setBookingError('No doctor selected.');
      return;
    }

    if (!selectedTime) {
      setBookingError('Please select an available time slot.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.bookAppointment({
        doctorId: doctor.id,
        hospitalId: doctor.hospitalId || undefined,
        department: doctor.department || `Department of ${doctor.specialty}`,
        date: selectedDate,
        timeSlot: selectedTime,
        appointmentType: appointmentType === 'TELEMEDICINE' ? 'ONLINE' : 'IN_PERSON',
        reason: reason.trim() || `Clinical consultation with ${doctor.name}`,
      });

      if (!res.success) {
        setBookingError(res.error || 'This time slot is no longer available. Please select another slot.');
        setSlotsRefreshKey((prev) => prev + 1);
        return;
      }

      addToast(
        'success',
        `Appointment confirmed with ${doctor.name} on ${displayDateText} at ${selectedTime}!`
      );

      setBookedAppointment(res.appointment || res.data || {
        appointmentNumber: 'APT-CONFIRMED',
        doctorName: doctor.name,
        date: selectedDate,
        timeSlot: selectedTime,
        status: 'CONFIRMED',
      });
    } catch (err: any) {
      setBookingError(err.message || 'Failed to book appointment. Please try again.');
      setSlotsRefreshKey((prev) => prev + 1);
    } finally {
      setSubmitting(false);
    }
  };

  if (doctorLoading) {
    return (
      <div className="p-12 text-center max-w-4xl mx-auto space-y-4">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-400">Loading doctor details from database...</p>
      </div>
    );
  }

  if (!doctor) {
    return null;
  }

  // Success Confirmation Screen
  if (bookedAppointment) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6 page-fade-in text-slate-100">
        <div className="bg-[#101012] rounded-[32px] border border-white/[0.08] p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Booking Confirmed
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
              Appointment Booked Successfully!
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Your consultation has been saved to PostgreSQL and registered on the hospital schedule.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141416] border border-white/[0.08] text-left space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-white/[0.08]">
              <span className="text-slate-400 font-medium">Appointment Number:</span>
              <span className="font-mono font-bold text-blue-400">
                {bookedAppointment.appointmentNumber || 'APT-CONFIRMED'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.08]">
              <span className="text-slate-400 font-medium">Doctor:</span>
              <span className="font-bold text-white">{doctor.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.08]">
              <span className="text-slate-400 font-medium">Specialization:</span>
              <span className="font-semibold text-cyan-400">{doctor.specialty}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.08]">
              <span className="text-slate-400 font-medium">Hospital:</span>
              <span className="font-medium text-slate-200">{doctor.hospital}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.08]">
              <span className="text-slate-400 font-medium">Date & Time:</span>
              <span className="font-bold text-cyan-400 font-mono">
                {displayDateText} at {selectedTime}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 font-medium">Status:</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                {bookedAppointment.status || 'CONFIRMED'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/patient/appointments')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              View Appointments
            </button>
            <button
              onClick={() => navigate('/patient/doctors')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/[0.10] bg-[#141416] text-slate-300 hover:text-white font-bold text-xs hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Book Another Appointment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 page-fade-in text-slate-100">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <BackButton fallbackPath="/patient/doctors" />
        <Link
          to="/patient/doctors"
          className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Doctor Directory</span>
        </Link>
      </div>

      {/* Header */}
      <ScrollReveal direction="left">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
            Apex EMR Consultation Booking
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            Book Appointment
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Select consultation date and confirmed time slot with your healthcare provider.
          </p>
        </div>
      </ScrollReveal>

      {/* Doctor Card Banner */}
      <ScrollReveal direction="right" delay={0.08}>
        <div className="bg-[#101012] rounded-[28px] border border-white/[0.08] p-6 sm:p-7 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xl flex-shrink-0 border border-blue-500/20 shadow-md">
                {doctor.name.split(' ')[1]?.[0] || 'D'}
                {doctor.name.split(' ')[2]?.[0] || 'R'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    {localizeValue(doctor.name, 'doctorName')}
                  </h2>
                  {doctor.isVerified && (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-cyan-400">
                  {doctor.specialty}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium text-slate-300">{doctor.hospital}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  {doctor.qualifications} • {doctor.experienceYears} Years Experience • Reg: {doctor.licenseNumber}
                </p>
              </div>
            </div>

            <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-white/[0.08]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Consultation Fee
              </span>
              <p className="text-lg sm:text-xl font-black text-white font-mono mt-0.5">
                {doctor.consultationFee || '₹850'}
              </p>
              <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
                ✓ Verified Doctor
              </span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Main Booking Form */}
      <form onSubmit={handleConfirmAppointment} className="space-y-6">
        {bookingError && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-start gap-3 page-fade-in">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-xs sm:text-sm">{bookingError}</h4>
              <p className="text-xs text-rose-400">
                Please pick another time slot from the schedule below to proceed with your booking.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 1: DATE SELECTION */}
        <ScrollReveal direction="left" delay={0.12}>
          <div className="bg-[#101012] rounded-[28px] border border-white/[0.08] p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                  SELECT DATE *
                </label>
              </div>
              <span className="text-xs text-slate-400">
                Upcoming 14-day schedule
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {availableDates.map((dateOpt) => {
                const isSelected = selectedDate === dateOpt.date;
                return (
                  <button
                    key={dateOpt.date}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateOpt.date);
                      setBookingError(null);
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/30'
                        : 'bg-[#141416] border-white/[0.08] hover:border-blue-500/50 text-slate-300'
                    }`}
                  >
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {dateOpt.dayName.slice(0, 3)}
                    </span>
                    <span className="text-sm font-black tracking-tight">
                      {dateOpt.formattedDay} {dateOpt.formattedMonth}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-blue-700 text-white'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      Open
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* SECTION 2: TIME SELECTION */}
        <ScrollReveal direction="right" delay={0.16}>
          <div className="bg-[#101012] rounded-[28px] border border-white/[0.08] p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                  AVAILABLE TIMES *
                </label>
              </div>
              <span className="text-xs text-slate-400">
                Schedule for {displayDateText}
              </span>
            </div>

            {slotsLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Checking slot availability with database...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {STANDARD_SLOTS.map((timeSlot) => {
                  const isBooked = bookedSlots.includes(timeSlot);
                  const isSelected = selectedTime === timeSlot && !isBooked;

                  return (
                    <button
                      key={timeSlot}
                      type="button"
                      disabled={isBooked}
                      onClick={() => {
                        setSelectedTime(timeSlot);
                        setBookingError(null);
                      }}
                      className={`py-3 px-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/30 cursor-pointer'
                          : isBooked
                          ? 'bg-white/[0.02] border-white/[0.04] text-slate-600 cursor-not-allowed opacity-50'
                          : 'bg-[#141416] border-white/[0.08] hover:border-blue-500/50 text-slate-300 cursor-pointer'
                      }`}
                    >
                      <span className="text-xs font-bold font-mono">{timeSlot}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-blue-700 text-white'
                            : isBooked
                            ? 'bg-rose-500/15 text-rose-400'
                            : 'bg-emerald-500/15 text-emerald-400'
                        }`}
                      >
                        {isBooked ? '🔴 Booked' : 'Open'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* SECTION 3: APPOINTMENT TYPE */}
        <ScrollReveal direction="left" delay={0.20}>
          <div className="bg-[#101012] rounded-[28px] border border-white/[0.08] p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="pb-3 border-b border-white/[0.08]">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white block">
                APPOINTMENT TYPE *
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose your preferred consultation format
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAppointmentType('IN_PERSON')}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                  appointmentType === 'IN_PERSON'
                    ? 'border-blue-500 bg-blue-500/15 text-white ring-2 ring-blue-500/25 shadow-lg shadow-blue-500/10'
                    : 'border-white/[0.08] bg-[#141416] text-slate-300 hover:border-white/[0.14]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-white">In-Person Consultation</h4>
                  <p className="text-xs text-slate-400">
                    Hospital OPD suite visit with digital queue entry pass
                  </p>
                  <span className="text-[10px] font-bold text-emerald-400 block pt-1">
                    ✓ Priority OPD Token Allocated
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAppointmentType('TELEMEDICINE')}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                  appointmentType === 'TELEMEDICINE'
                    ? 'border-blue-500 bg-blue-500/15 text-white ring-2 ring-blue-500/25 shadow-lg shadow-blue-500/10'
                    : 'border-white/[0.08] bg-[#141416] text-slate-300 hover:border-white/[0.14]'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-white">Telemedicine</h4>
                  <p className="text-xs text-slate-400">
                    Secure encrypted video consultation from home
                  </p>
                  <span className="text-[10px] font-bold text-cyan-400 block pt-1">
                    ✓ Video link sent 10 min prior
                  </span>
                </div>
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* SECTION 4: REASON FOR VISIT */}
        <ScrollReveal direction="right" delay={0.24}>
          <div className="bg-[#101012] rounded-[28px] border border-white/[0.08] p-6 sm:p-7 shadow-2xl space-y-3">
            <div className="pb-2 border-b border-white/[0.08]">
              <label className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white block">
                REASON FOR VISIT (OPTIONAL)
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                Provide brief clinical context or symptoms for your physician
              </p>
            </div>

            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe symptoms, medical purpose, or checkup reason..."
              className="w-full p-4 rounded-2xl border border-white/[0.10] bg-[#141416] text-white text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 leading-relaxed placeholder-slate-500"
            />
          </div>
        </ScrollReveal>

        {/* SECTION 5: APPOINTMENT SUMMARY & CONFIRM */}
        <ScrollReveal direction="center" delay={0.28}>
          <div className="bg-gradient-to-br from-[#101012] to-[#141416] text-white rounded-[28px] p-6 sm:p-8 shadow-2xl border border-white/[0.12] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  Summary Verification
                </span>
                <h3 className="text-lg font-black text-white">Appointment Summary</h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Sovereign EMR Verified</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#18181B] border border-white/[0.08] space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Doctor:</span>
                <p className="font-bold text-white text-sm">{doctor.name}</p>
                <p className="text-[11px] text-cyan-400 font-medium">{doctor.specialty}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#18181B] border border-white/[0.08] space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Hospital:</span>
                <p className="font-bold text-white text-sm">{doctor.hospital}</p>
                <p className="text-[11px] text-slate-400">{doctor.department}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#18181B] border border-white/[0.08] space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Date & Time:</span>
                <p className="font-bold text-blue-400 text-sm font-mono">{displayDateText}</p>
                <p className="text-[11px] text-white font-mono font-bold">
                  {selectedTime ? selectedTime : 'Time slot pending'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#18181B] border border-white/[0.08] space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Type:</span>
                <p className="font-bold text-white text-sm">
                  {appointmentType === 'IN_PERSON' ? 'In-Person Consultation' : 'Telemedicine'}
                </p>
                <p className="text-[11px] text-emerald-400 font-semibold">Status: 🟢 CONFIRMED</p>
              </div>
            </div>

            {reason.trim() && (
              <div className="p-3.5 rounded-2xl bg-[#18181B]/80 border border-white/[0.06] text-xs">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Reason:</span>
                <p className="text-slate-300 mt-0.5">{reason.trim()}</p>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-400">
                By confirming, this time slot is locked in PostgreSQL and registered on the doctor's agenda.
              </p>

              <button
                type="submit"
                disabled={submitting || !selectedTime}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-xs sm:text-sm font-black transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  submitting || !selectedTime
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25'
                }`}
              >
                <span>{submitting ? 'Confirming...' : 'Confirm Appointment'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </ScrollReveal>
      </form>
    </div>
  );
};

export default PatientBookAppointmentPage;
