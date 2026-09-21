import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Stethoscope,
  Pill,
  Activity,
  MapPin,
  CheckCircle2,
  Bell,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import { BackButton } from '../../components/common/BackButton';
import { api } from '../../services/api';
import { ScrollReveal, ScrollRevealGroup } from '../../components/common/ScrollReveal';

export interface CalendarActivity {
  id: string;
  year: number;
  month: number; // 0-indexed
  day: number;
  title: string;
  time: string;
  category: 'APPOINTMENT' | 'MEDICINE' | 'CONSULTATION' | 'PRESCRIPTION' | 'LAB_REPORT' | 'HEALTH_ACTIVITY' | 'REMINDER';
  location: string;
  provider?: string;
  description: string;
}

export const PatientHealthCalendarPage: React.FC = () => {
  const { addToast } = useToast();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // New Event Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<CalendarActivity['category']>('REMINDER');
  const [newTime, setNewTime] = useState('09:00 AM');
  const [newLocation, setNewLocation] = useState('Apex Clinic');
  const [newDesc, setNewDesc] = useState('');

  // Dynamic activities loaded from real PostgreSQL patient data
  const [activities, setActivities] = useState<CalendarActivity[]>([]);

  React.useEffect(() => {
    loadCalendarData();
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const [aptRes, medRes, conRes, rxRes, labRes] = await Promise.all([
        api.getAppointments().catch(() => ({ appointments: [] })),
        api.getMedicines().catch(() => ({ medicines: [] })),
        api.getConsultations().catch(() => ({ consultations: [] })),
        api.getPrescriptions().catch(() => ({ prescriptions: [] })),
        api.getLabReports().catch(() => ({ labReports: [] })),
      ]);

      const items: CalendarActivity[] = [];

      // 1. Appointments
      const appointments = aptRes?.appointments || aptRes?.data || [];
      appointments.forEach((apt: any) => {
        if (!apt.date) return;
        const d = new Date(apt.date);
        if (isNaN(d.getTime())) return;
        items.push({
          id: `apt-${apt.id}`,
          year: d.getFullYear(),
          month: d.getMonth(),
          day: d.getDate(),
          title: `Doctor Appointment: ${apt.doctor?.fullName || 'Dr. Practitioner'}`,
          time: apt.timeSlot || '10:00 AM',
          category: 'APPOINTMENT',
          location: apt.hospital?.name || 'Apex Health City',
          provider: apt.doctor?.fullName || 'Doctor',
          description: `${apt.appointmentType || 'In-Person'} • Dept: ${apt.department || 'General'} • Status: ${apt.status}`,
        });
      });

      // 2. Consultations
      const consultations = conRes?.consultations || conRes?.data || [];
      consultations.forEach((con: any) => {
        if (!con.date && !con.createdAt) return;
        const d = new Date(con.date || con.createdAt);
        if (isNaN(d.getTime())) return;
        items.push({
          id: `con-${con.id}`,
          year: d.getFullYear(),
          month: d.getMonth(),
          day: d.getDate(),
          title: `Consultation: ${con.diagnosis || 'Clinical Review'}`,
          time: con.time || '11:30 AM',
          category: 'CONSULTATION',
          location: con.hospital?.name || 'Apex Health City',
          provider: con.doctor?.fullName || 'Dr. Consultant',
          description: `Diagnosis: ${con.diagnosis || 'Routine Review'}${con.symptoms ? ` • Symptoms: ${con.symptoms}` : ''}`,
        });
      });

      // 3. Prescriptions
      const prescriptions = rxRes?.prescriptions || rxRes?.data || [];
      prescriptions.forEach((rx: any) => {
        if (!rx.createdAt) return;
        const d = new Date(rx.createdAt);
        if (isNaN(d.getTime())) return;
        const medNames = rx.medicines ? rx.medicines.map((m: any) => m.medicineName).join(', ') : 'Medication';
        items.push({
          id: `rx-${rx.id}`,
          year: d.getFullYear(),
          month: d.getMonth(),
          day: d.getDate(),
          title: `Prescription: ${rx.prescriptionNumber || 'RX'} (${rx.diagnosis || 'Prescribed'})`,
          time: '04:00 PM',
          category: 'PRESCRIPTION',
          location: 'Digital Pharmacy',
          provider: rx.doctor?.fullName || 'Doctor',
          description: `Prescribed: ${medNames} • Blockchain Hash: ${rx.recordHash ? rx.recordHash.slice(0, 16) + '...' : 'Verified'}`,
        });
      });

      // 4. Lab Reports
      const labReports = labRes?.labReports || labRes?.reports || labRes?.data || [];
      labReports.forEach((lab: any) => {
        if (!lab.resultDate && !lab.createdAt && !lab.sampleDate) return;
        const d = new Date(lab.resultDate || lab.createdAt || lab.sampleDate);
        if (isNaN(d.getTime())) return;
        items.push({
          id: `lab-${lab.id}`,
          year: d.getFullYear(),
          month: d.getMonth(),
          day: d.getDate(),
          title: `Lab Report: ${lab.testName || 'Diagnostic Report'} Available`,
          time: '06:30 PM',
          category: 'LAB_REPORT',
          location: lab.laboratoryName || 'Diagnostic Lab',
          description: `Category: ${lab.category || 'Pathology'} • Result Summary: ${lab.summary || 'Normal'}`,
        });
      });

      // 5. Medicines
      const medicines = medRes?.medicines || medRes?.data || [];
      const viewY = currentDate.getFullYear();
      const viewM = currentDate.getMonth();
      const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();

      medicines.forEach((med: any) => {
        if (med.status !== 'ACTIVE' && med.status !== 'PAUSED') return;
        const timeSlotStr = med.timingSlot === 'MORNING'
          ? '08:00 AM'
          : med.timingSlot === 'AFTERNOON'
          ? '01:00 PM'
          : med.timingSlot === 'EVENING'
          ? '06:00 PM'
          : '09:00 PM';

        for (let day = 1; day <= daysInMonth; day++) {
          items.push({
            id: `med-${med.id}-${day}`,
            year: viewY,
            month: viewM,
            day: day,
            title: `Medicine: ${med.medicineName} (${med.timingSlot || 'Scheduled'} Dose)`,
            time: timeSlotStr,
            category: 'MEDICINE',
            location: 'Home Medication Tracker',
            description: `${med.frequency || 'Daily'} • Dosage: ${med.dosage || '1 tablet'} • Stock: ${med.stock ?? 10}`,
          });
        }
      });

      setActivities(items);
    } catch (err) {
      console.error('Failed to load calendar events from PostgreSQL:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewYear = currentDate.getFullYear();
  const viewMonth = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(viewYear, viewMonth - 1, 1));
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(viewYear, viewMonth + 1, 1));
    setSelectedDay(1);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(now.getDate());
  };

  // Month calculation
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Filter activities for selected day
  const currentMonthActivities = activities.filter(
    (a) => a.year === viewYear && a.month === viewMonth
  );

  const selectedDayActivities = currentMonthActivities.filter(
    (a) => a.day === selectedDay
  );

  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newAct: CalendarActivity = {
      id: `act-${Date.now()}`,
      year: viewYear,
      month: viewMonth,
      day: selectedDay,
      title: newTitle,
      time: newTime,
      category: newCategory,
      location: newLocation,
      description: newDesc || 'Scheduled patient health activity.',
    };

    setActivities([...activities, newAct]);
    setShowAddModal(false);
    setNewTitle('');
    setNewDesc('');
    addToast('success', `Added "${newTitle}" for ${monthNames[viewMonth]} ${selectedDay}, ${viewYear}.`);
  };

  const getCategoryBadge = (cat: CalendarActivity['category']) => {
    switch (cat) {
      case 'APPOINTMENT':
        return {
          badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]',
          icon: <Stethoscope className="w-4 h-4 text-blue-400" />,
        };
      case 'MEDICINE':
        return {
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
          icon: <Pill className="w-4 h-4 text-amber-400" />,
        };
      case 'CONSULTATION':
        return {
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          dot: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]',
          icon: <Stethoscope className="w-4 h-4 text-purple-400" />,
        };
      case 'PRESCRIPTION':
        return {
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
          icon: <Pill className="w-4 h-4 text-emerald-400" />,
        };
      case 'LAB_REPORT':
        return {
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
          icon: <Activity className="w-4 h-4 text-rose-400" />,
        };
      case 'HEALTH_ACTIVITY':
        return {
          badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
          dot: 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.6)]',
          icon: <Activity className="w-4 h-4 text-teal-400" />,
        };
      case 'REMINDER':
      default:
        return {
          badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          dot: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]',
          icon: <Bell className="w-4 h-4 text-cyan-400" />,
        };
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <ScrollReveal direction="left">
        <div className="flex items-center justify-between">
          <BackButton fallbackPath="/patient" />
        </div>
      </ScrollReveal>

      {/* Header */}
      <ScrollReveal direction="left" delay={0.05}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full">
              Clinical Calendar & Planner
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
              Health Activity Calendar
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Track upcoming doctor visits, medicines, health activities, and reminders across all months.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-900/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reminder</span>
          </button>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid (8 cols) */}
        <ScrollReveal direction="left" delay={0.1} className="lg:col-span-8">
          <div className="bg-[#0B0B0D] p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
            {/* Navigation Controls: < Month Year > with [Previous] [Today] [Next] */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-white tracking-tight">
                  &lt; {monthNames[viewMonth]} {viewYear} &gt;
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="px-3.5 py-1.5 rounded-xl border border-white/10 text-zinc-300 hover:bg-white/5 text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  onClick={handleToday}
                  className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors"
                >
                  Today
                </button>

                <button
                  onClick={handleNextMonth}
                  className="px-3.5 py-1.5 rounded-xl border border-white/10 text-zinc-300 hover:bg-white/5 text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Day Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Blank leading days */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`blank-${i}`} className="h-16 sm:h-20 rounded-2xl bg-white/[0.02] border border-white/[0.02]" />
              ))}

              {/* Days in current month */}
              {Array.from({ length: totalDaysInMonth }).map((_, i) => {
                const dayNumber = i + 1;
                const dayActivities = currentMonthActivities.filter((a) => a.day === dayNumber);
                const isSelected = selectedDay === dayNumber;

                return (
                  <button
                    key={`day-${dayNumber}`}
                    onClick={() => setSelectedDay(dayNumber)}
                    className={`h-16 sm:h-20 p-2 rounded-2xl border text-left flex flex-col justify-between transition-all relative group ${
                      isSelected
                        ? 'bg-teal-500/10 border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.15)] ring-1 ring-teal-500/40'
                        : 'bg-[#101012] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span
                      className={`text-xs font-bold ${
                        isSelected
                          ? 'text-teal-300 font-black'
                          : 'text-zinc-300 group-hover:text-white'
                      }`}
                    >
                      {dayNumber}
                    </span>

                    {/* Activity dots */}
                    {dayActivities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {dayActivities.slice(0, 3).map((act) => {
                          const style = getCategoryBadge(act.category);
                          return (
                            <span
                              key={act.id}
                              className={`w-2 h-2 rounded-full ${style.dot}`}
                              title={act.title}
                            />
                          );
                        })}
                        {dayActivities.length > 3 && (
                          <span className="text-[9px] font-bold text-zinc-500">
                            +{dayActivities.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-white/5 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />
                <span>Appointments</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                <span>Medicines</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-[0_0_6px_rgba(20,184,166,0.6)]" />
                <span>Health Activities</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
                <span>Reminders</span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Selected Day Activities Inspector (4 cols) */}
        <ScrollReveal direction="right" delay={0.15} className="lg:col-span-4">
          <div className="bg-[#0B0B0D] p-6 rounded-3xl border border-white/10 shadow-2xl space-y-6">
            <div className="border-b border-white/5 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Scheduled Activities
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {monthNames[viewMonth]} {selectedDay}, {viewYear}
                </h3>
              </div>

              <span className="text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-lg">
                {selectedDayActivities.length} {selectedDayActivities.length === 1 ? 'Event' : 'Events'}
              </span>
            </div>

            {selectedDayActivities.length === 0 ? (
              <div className="text-center py-10 space-y-2 text-zinc-500">
                <CalendarIcon className="w-10 h-10 mx-auto text-zinc-600" />
                <p className="text-xs font-medium text-zinc-400">No events scheduled for this date.</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-xs font-bold text-teal-400 hover:text-teal-300 inline-block mt-2 transition-colors"
                >
                  + Schedule Activity for Day {selectedDay}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDayActivities.map((act) => {
                  const style = getCategoryBadge(act.category);
                  return (
                    <div
                      key={act.id}
                      className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-2.5 hover:border-white/15 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style.badge}`}
                        >
                          {act.category.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          {act.time}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white">{act.title}</h4>

                      <p className="text-xs text-zinc-400 leading-relaxed">{act.description}</p>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                          {act.location}
                        </span>
                        {act.provider && (
                          <span className="text-zinc-300 font-semibold">{act.provider}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>

      {/* Add Reminder Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Add Activity for ${monthNames[viewMonth]} ${selectedDay}, ${viewYear}`}
      >
        <form onSubmit={handleCreateActivity} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Morning Blood Pressure Reading"
              className="w-full px-3 py-2 rounded-xl bg-[#141416] border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Category *
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#141416] border border-white/10 text-white focus:outline-none focus:border-teal-500 transition-colors"
              >
                <option value="APPOINTMENT">Appointment</option>
                <option value="MEDICINE">Medicine Dose</option>
                <option value="HEALTH_ACTIVITY">Health Activity / Test</option>
                <option value="REMINDER">Reminder</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Time *
              </label>
              <input
                type="text"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="09:00 AM"
                className="w-full px-3 py-2 rounded-xl bg-[#141416] border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Location / Facility
            </label>
            <input
              type="text"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="e.g. Apex Hospital or Home"
              className="w-full px-3 py-2 rounded-xl bg-[#141416] border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
              Description / Notes
            </label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Additional clinical or personal reminders..."
              className="w-full px-3 py-2 rounded-xl bg-[#141416] border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500 transition-colors"
              rows={2}
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl border border-white/10 text-zinc-300 font-bold hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all shadow-lg shadow-teal-900/30"
            >
              Save Event
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
