import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  UserCheck,
  ShieldCheck,
  Search,
  Users,
  FileText,
  Pill,
  Stethoscope,
  ArrowRight,
  Clock,
  Lock,
  Plus,
  RefreshCw,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { DoctorPatientEmrPage } from './DoctorPatientEmrPage';
import {
  ScrollReveal,
  ScrollRevealGroup,
  PremiumCard,
  GlowCard,
  StatusBadge,
} from '../../components/common/ScrollReveal';

export const DoctorCurrentPatientPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { t } = useLanguage();

  // If a specific patient ID is provided in route params, render the detailed Current Patient workspace for that patient
  if (id) {
    return <DoctorPatientEmrPage />;
  }

  // Otherwise, render the Current Patient module list showing only patients who have granted active EMR access
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchActivePatients = async () => {
    try {
      setLoading(true);
      const res = await api.getAuthorizedPatients();
      if (res && res.success) {
        setPatients(res.patients || []);
      } else {
        setPatients([]);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to load authorized patients.');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivePatients();
  }, []);

  const filteredPatients = patients.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.fullName && p.fullName.toLowerCase().includes(q)) ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.healthId && p.healthId.toLowerCase().includes(q)) ||
      (p.abhaId && p.abhaId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-24 text-white antialiased">
      {/* Header */}
      <ScrollReveal direction="left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20">
              <UserCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Current Patient Module</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 tracking-tight">
              Current Authorized Patients
            </h1>
            <p className="text-xs sm:text-sm text-white/50 mt-1 max-w-2xl">
              Patients who have granted you active EMR consent clearance or active emergency clinical access. Select a patient to open their dedicated Current Patient workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchActivePatients}
              disabled={loading}
              className="px-4 py-2.5 rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 hover:text-white hover:bg-white/[0.08] text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-teal-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <Link
              to="/doctor/patients"
              className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-600/20 flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>Search Patient Directory</span>
            </Link>
          </div>
        </div>
      </ScrollReveal>

      {/* Filter / Search Bar */}
      <ScrollReveal direction="bottom" delay={0.08}>
        <div className="bg-[#0B0B0D] p-4 sm:p-5 rounded-[28px] border border-white/[0.08] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, Health ID, ABHA ID..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-white placeholder-white/40 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="text-xs font-bold text-white/50 whitespace-nowrap px-2">
            <span>Active Clearances: </span>
            <span className="text-teal-400 font-mono font-bold text-sm">
              {patients.length}
            </span>
          </div>
        </div>
      </ScrollReveal>

      {/* Patient Cards Grid */}
      {loading ? (
        <div className="p-16 text-center bg-[#0B0B0D] rounded-[32px] border border-white/[0.08] space-y-4">
          <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-white/50">Checking active permissions from PostgreSQL...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <ScrollReveal direction="bottom">
          <div className="bg-[#0B0B0D] p-12 text-center rounded-[32px] border border-white/[0.08] space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/20">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-white">
                {searchQuery ? 'No matching authorized patients found' : 'No patients have granted you EMR access yet.'}
              </h3>
              <p className="text-xs text-white/50 leading-relaxed">
                {searchQuery
                  ? 'Try adjusting your search query or check the Health ID.'
                  : 'To view a patient’s medical records, search for the patient in the Patient Directory and submit an EMR access request.'}
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/doctor/patients"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-600/20"
              >
                <Search className="w-4 h-4" />
                <span>Go to Patient Directory</span>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient, idx) => {
            const isEmergency = patient.accessStatus === 'EMERGENCY_ACTIVE';
            return (
              <ScrollReveal key={patient.id} direction="bottom" delay={idx * 0.05}>
                <div className="bg-[#0B0B0D] rounded-[32px] border border-white/[0.08] p-6 space-y-5 shadow-xl hover:border-teal-500/30 transition-all duration-200 flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    {/* Top Identity Row */}
                    <div className="flex items-start gap-4">
                      <ProfileAvatar
                        photoUrl={patient.profilePhoto}
                        name={patient.fullName || patient.name}
                        role="PATIENT"
                        size="lg"
                        shape="rounded"
                        className="border-2 border-white/10 shadow-md flex-shrink-0"
                      />
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            isEmergency
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          }`}>
                            {isEmergency ? 'EMERGENCY ACCESS' : 'ACTIVE CONSENT'}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified</span>
                          </span>
                        </div>

                        <h3 className="text-base font-black text-white truncate">
                          {patient.fullName || patient.name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                            {patient.healthId}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details Badge */}
                    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/70 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white/40">Gender / DOB:</span>
                        <span className="font-semibold text-white">{patient.gender || '—'} {patient.dob ? `(${patient.dob})` : ''}</span>
                      </div>
                      {patient.bloodGroup && (
                        <div className="flex items-center justify-between">
                          <span className="text-white/40">Blood Group:</span>
                          <span className="font-bold text-rose-400">{patient.bloodGroup}</span>
                        </div>
                      )}
                      {patient.expiresAt && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.06]">
                          <span className="text-white/40 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-teal-400" />
                            <span>Expires:</span>
                          </span>
                          <span className="font-semibold text-white">
                            {new Date(patient.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/doctor/current-patient/${patient.id}`)}
                      className="w-full py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Open Patient Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-3 gap-2">
                      <Link
                        to={`/doctor/consultation/new?patientId=${patient.id}&healthId=${patient.healthId}&name=${encodeURIComponent(patient.fullName || patient.name)}`}
                        className="py-2.5 px-1.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-[11px] font-bold text-white/80 hover:text-white flex items-center justify-center gap-1 transition-colors truncate"
                        title="Add Consultation"
                      >
                        <Stethoscope className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                        <span className="truncate">Consult</span>
                      </Link>

                      <Link
                        to={`/doctor/prescriptions?patientId=${patient.id}&healthId=${patient.healthId}&name=${encodeURIComponent(patient.fullName || patient.name)}`}
                        className="py-2.5 px-1.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-[11px] font-bold text-white/80 hover:text-white flex items-center justify-center gap-1 transition-colors truncate"
                        title="Add Prescription"
                      >
                        <Pill className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span className="truncate">Prescribe</span>
                      </Link>

                      <Link
                        to={`/doctor/current-patient/${patient.id}/reports`}
                        className="py-2.5 px-1.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-[11px] font-bold text-white/80 hover:text-white flex items-center justify-center gap-1 transition-colors truncate"
                        title="Add / View Reports"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        <span className="truncate">Reports</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoctorCurrentPatientPage;
