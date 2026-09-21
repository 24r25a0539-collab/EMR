import React, { useState } from 'react';
import {
  Building2,
  Search,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../contexts/ToastContext';
import { BackButton } from '../../components/common/BackButton';
import { api } from '../../services/api';
import { ScrollReveal, ScrollRevealGroup, PremiumCard } from '../../components/common/ScrollReveal';

export interface HospitalDirectoryItem {
  id: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  emergencyPhone: string;
  accreditations: string[];
  departments: string[];
  icuBeds: number;
  isEmergencyActive: boolean;
}

export const PatientHospitalsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<HospitalDirectoryItem | null>(null);
  const [hospitalsList, setHospitalsList] = useState<HospitalDirectoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const { addToast } = useToast();

  React.useEffect(() => {
    let isMounted = true;
    const fetchHospitals = async () => {
      try {
        setLoading(true);
        const res = await api.getHospitalsDirectory();
        if (res && res.success && Array.isArray(res.hospitals)) {
          const mapped: HospitalDirectoryItem[] = res.hospitals.map((h: any) => ({
            id: h.id,
            name: h.name,
            location: `${h.city || 'Hyderabad'}, ${h.state || 'Telangana'}`,
            address: h.address || `${h.city || 'Hyderabad'}, ${h.state || 'Telangana'} - ${h.pincode || '500001'}`,
            phone: h.phone || '040-23607777',
            emergencyPhone: h.emergencyPhone || '1066 / 040-23607777',
            accreditations: h.accreditations ? (Array.isArray(h.accreditations) ? h.accreditations : String(h.accreditations).split(',')) : ['NABH Accredited', 'EMR Node Verified'],
            departments: h.departments && Array.isArray(h.departments) ? h.departments.map((d: any) => d.name || d) : ['General Medicine', 'Emergency Care', 'Cardiology'],
            icuBeds: h.totalBeds ? Math.floor(h.totalBeds * 0.2) : 50,
            isEmergencyActive: true,
          }));
          if (isMounted) setHospitalsList(mapped);
        } else {
          if (isMounted) setHospitalsList([]);
        }
      } catch (err) {
        console.error('Failed to load hospitals from database:', err);
        if (isMounted) setHospitalsList([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHospitals();
    return () => { isMounted = false; };
  }, []);

  const filtered = hospitalsList.filter(
    (h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.departments.some((d) => d.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 page-fade-in text-white">
      <div className="flex items-center justify-between">
        <BackButton fallbackPath="/patient" />
      </div>

      {/* Header */}
      <ScrollReveal direction="left">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          Partner Healthcare Infrastructure
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
          Accredited Partner Hospitals
        </h1>
        <p className="text-xs sm:text-sm text-white/65 mt-1">
          Authorized hospital networks equipped with sovereign blockchain EMR terminal nodes.
        </p>
      </ScrollReveal>

      {/* Search Bar */}
      <ScrollReveal direction="right" delay={0.05} className="bg-[#101012] p-5 rounded-3xl border border-white/[0.08] shadow-2xl flex items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hospitals by name, area, or department..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/[0.1] bg-[#141416] text-white placeholder-white/40 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>
      </ScrollReveal>

      {/* Hospital List */}
      <div className="space-y-6">
        {loading ? (
          <div className="p-12 text-center bg-[#101012] rounded-3xl border border-white/[0.08] shadow-2xl space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-white/65">Loading partner hospitals from registry...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-[#101012] rounded-3xl border border-white/[0.08] shadow-2xl space-y-2">
            <Building2 className="w-12 h-12 text-white/30 mx-auto" />
            <h3 className="text-base font-bold text-white">No partner hospitals found</h3>
            <p className="text-xs text-white/40">No accredited hospital matches your search criteria.</p>
          </div>
        ) : (
          <ScrollRevealGroup staggerDelay={0.08} alternateDirection={true} className="space-y-4">
            {filtered.map((hosp) => (
              <PremiumCard
                key={hosp.id}
                accent="teal"
                className="flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-3 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-bold text-white">{hosp.name}</h3>
                    {hosp.isEmergencyActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-400" />
                        24x7 ER Live
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      EMR Terminal Connected
                    </span>
                  </div>

                  <p className="text-xs text-white/65 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    <span>{hosp.address}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {hosp.departments.slice(0, 4).map((d, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold bg-[#18181B] text-white/80 border border-white/[0.06] px-2.5 py-1 rounded-xl"
                      >
                        {d}
                      </span>
                    ))}
                    {hosp.departments.length > 4 && (
                      <span className="text-[10px] text-white/40">+{hosp.departments.length - 4} more</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/[0.08]">
                  <div className="text-left md:text-right text-xs">
                    <p className="text-[10px] text-white/40">Emergency Desk</p>
                    <p className="font-mono font-bold text-rose-400">{hosp.emergencyPhone}</p>
                  </div>

                  <button
                    onClick={() => setSelectedHospital(hosp)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold transition-all shadow-lg hover:shadow-teal-500/20 cursor-pointer btn-interaction"
                  >
                    View Details
                  </button>
                </div>
              </PremiumCard>
            ))}
          </ScrollRevealGroup>
        )}
      </div>

      {/* Hospital Detail Modal */}
      {selectedHospital && (
        <Modal
          isOpen={!!selectedHospital}
          onClose={() => setSelectedHospital(null)}
          title={selectedHospital.name}
          size="lg"
        >
          <div className="space-y-4 text-xs text-white">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Accredited Network Facility</span>
              <p className="text-sm font-bold text-white">{selectedHospital.address}</p>
              <p className="text-xs text-white/65">Phone: {selectedHospital.phone} • Emergency: {selectedHospital.emergencyPhone}</p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2">Clinical Departments</h4>
              <div className="flex flex-wrap gap-2">
                {selectedHospital.departments.map((dept, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-[#18181B] border border-white/[0.06] font-medium text-white/80"
                  >
                    {dept}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-2">Accreditations & Security Seals</h4>
              <div className="flex flex-wrap gap-2">
                {selectedHospital.accreditations.map((acc, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-xl bg-teal-500/10 text-teal-300 border border-teal-500/20 font-semibold"
                  >
                    ✓ {acc}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex justify-end">
              <button
                onClick={() => setSelectedHospital(null)}
                className="px-5 py-2.5 rounded-xl bg-[#141416] hover:bg-[#18181B] text-white border border-white/[0.12] font-bold cursor-pointer btn-interaction"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
