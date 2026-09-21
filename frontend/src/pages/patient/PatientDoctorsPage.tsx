import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Search,
  Filter,
  CheckCircle2,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  Star,
  Award,
  ArrowRight,
  Phone,
  Mail,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import { BackButton } from '../../components/common/BackButton';
import { api } from '../../services/api';
import {
  DoctorDirectoryItem,
  mapDbDoctorToDirectoryItem,
  getDoctorWithBookingLink,
} from '../../services/doctorDirectoryData';
import { appointmentBookingService } from '../../services/appointmentBookingService';
import { useLanguage } from '../../contexts/LanguageContext';
import { ScrollReveal, ScrollRevealGroup, PremiumCard } from '../../components/common/ScrollReveal';

export type { DoctorDirectoryItem };

export const PatientDoctorsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDirectoryItem | null>(null);
  const [doctorsList, setDoctorsList] = useState<DoctorDirectoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { addToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const res = await api.getDoctorsDirectory(
          searchQuery || undefined,
          specialtyFilter === 'ALL' ? undefined : specialtyFilter
        );
        if (res && res.success && Array.isArray(res.doctors)) {
          const mapped: DoctorDirectoryItem[] = res.doctors.map(mapDbDoctorToDirectoryItem);
          // Canonical deduplication by primary Doctor ID
          const uniqueMap = new Map<string, DoctorDirectoryItem>();
          for (const item of mapped) {
            if (item.id && !uniqueMap.has(item.id)) {
              uniqueMap.set(item.id, item);
            }
          }
          if (isMounted) setDoctorsList(Array.from(uniqueMap.values()));
        } else {
          if (isMounted) setDoctorsList([]);
        }
      } catch (err) {
        console.error('Failed to load doctors from database:', err);
        if (isMounted) setDoctorsList([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDoctors();
    return () => { isMounted = false; };
  }, [searchQuery, specialtyFilter]);

  const handleBookAppointmentClick = (doc: DoctorDirectoryItem) => {
    // Check if doctor has an official booking link saved
    const officialLink = appointmentBookingService.getDoctorBookingLink(doc.id, doc.name);
    if (officialLink && officialLink.trim()) {
      addToast('info', `Taking you to ${doc.name}'s official booking page...`);
      window.open(officialLink.trim(), '_blank', 'noopener,noreferrer');
      return;
    }

    // Navigate to internal Apex EMR booking page with real selected doctor
    navigate(`/patient/appointments/book?doctor=${encodeURIComponent(doc.id)}`, {
      state: { doctor: getDoctorWithBookingLink(doc) },
    });
  };

  const filtered = doctorsList.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.hospital.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = specialtyFilter === 'ALL' || doc.specialty === specialtyFilter;
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 page-fade-in text-white">
      <div className="flex items-center justify-between">
        <BackButton fallbackPath="/patient/appointments" />
      </div>

      {/* Header with Directional Reveal */}
      <ScrollReveal direction="left">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
          Accredited Clinical Directory
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
          Find Verified Doctors
        </h1>
        <p className="text-xs sm:text-sm text-white/65 mt-1">
          Connect with medical council licensed practitioners. Grant scoped EMR access with confidence.
        </p>
      </ScrollReveal>

      {/* Filter Bar */}
      <ScrollReveal direction="right" delay={0.05} className="bg-[#101012] p-5 rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doctor by name, specialty, or clinic..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/[0.1] bg-[#141416] text-white placeholder-white/40 text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2">
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-white/[0.1] text-xs bg-[#141416] text-white focus:border-cyan-500 transition-all cursor-pointer"
          >
            <option value="ALL">All Specializations</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Neurology">Neurology</option>
            <option value="Dermatology">Dermatology</option>
            <option value="General Medicine">General Medicine</option>
          </select>
        </div>
      </ScrollReveal>

      {/* Doctor Cards Grid */}
      {loading ? (
        <div className="p-12 text-center bg-[#101012] rounded-3xl border border-white/[0.08] shadow-2xl space-y-3">
          <div className="w-8 h-8 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-white/65">Loading verified doctors from database...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-[#101012] rounded-3xl border border-white/[0.08] shadow-2xl space-y-2">
          <Stethoscope className="w-12 h-12 text-white/30 mx-auto" />
          <h3 className="text-base font-bold text-white">No verified doctors found</h3>
          <p className="text-xs text-white/40">No approved doctors matched your search criteria or specialization filter.</p>
        </div>
      ) : (
        <ScrollRevealGroup staggerDelay={0.08} alternateDirection={true} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((doc) => (
            <PremiumCard
              key={doc.id}
              accent="blue"
              className="flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-lg shrink-0 border border-cyan-500/20 shadow-lg">
                      {doc.name.split(' ')[1]?.[0] || 'D'}
                      {doc.name.split(' ')[2]?.[0] || 'R'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-white">{doc.name}</h3>
                        {doc.isVerified ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Verified
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs font-semibold text-cyan-400 mt-0.5">{doc.specialty}</p>
                      <p className="text-[11px] text-white/65">{doc.qualifications} • {doc.experienceYears}+ Yrs Clinical Exp</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-xl">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{doc.rating}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#141416] border border-white/[0.08] space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-white/90 font-medium">
                    <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="truncate">{doc.hospital}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/65 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Licence: {doc.licenseNumber} ({doc.council})</span>
                  </div>
                </div>

                <p className="text-xs text-white/65 leading-relaxed line-clamp-2">
                  {doc.bio}
                </p>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
                <button
                  onClick={() => setSelectedDoctor(doc)}
                  className="px-4 py-2.5 rounded-xl border border-white/[0.12] hover:bg-white/[0.06] text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  View Profile
                </button>

                <button
                  onClick={() => handleBookAppointmentClick(doc)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-lg hover:shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer btn-interaction"
                >
                  <span>Book Appointment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </PremiumCard>
          ))}
        </ScrollRevealGroup>
      )}

      {/* Doctor Detail Modal */}
      {selectedDoctor && (
        <Modal
          isOpen={!!selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          title={`Doctor Profile: ${selectedDoctor.name}`}
          size="lg"
        >
          <div className="space-y-5 text-xs text-white">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <div className="w-16 h-16 rounded-2xl bg-cyan-600 text-white flex items-center justify-center font-bold text-2xl shrink-0 shadow-lg">
                {selectedDoctor.name.split(' ')[1]?.[0] || 'D'}
                {selectedDoctor.name.split(' ')[2]?.[0] || 'R'}
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">{selectedDoctor.name}</h3>
                <p className="text-xs font-semibold text-cyan-400">{selectedDoctor.specialty}</p>
                <p className="text-[11px] text-white/65">{selectedDoctor.qualifications} • {selectedDoctor.experienceYears} Years Experience</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                    Medical Council Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#141416] border border-white/[0.08] space-y-1">
                <span className="text-[10px] uppercase font-bold text-white/40">Primary Hospital</span>
                <p className="font-semibold text-white">{selectedDoctor.hospital}</p>
                <p className="text-[11px] text-white/65">{selectedDoctor.department}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141416] border border-white/[0.08] space-y-1">
                <span className="text-[10px] uppercase font-bold text-white/40">Medical Registration</span>
                <p className="font-mono font-bold text-white">{selectedDoctor.licenseNumber}</p>
                <p className="text-[11px] text-white/65">{selectedDoctor.council}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-white">Clinical Biography</h4>
              <p className="text-white/65 leading-relaxed">
                {selectedDoctor.bio}
              </p>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedDoctor(null)}
                className="px-4 py-2.5 rounded-xl border border-white/[0.12] text-white font-bold hover:bg-white/[0.06] cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const doc = selectedDoctor;
                  setSelectedDoctor(null);
                  handleBookAppointmentClick(doc);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold flex items-center gap-1.5 shadow-lg cursor-pointer btn-interaction"
              >
                <span>Book Appointment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
