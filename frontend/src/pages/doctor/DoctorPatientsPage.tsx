import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Lock,
  Clock,
  Fingerprint,
  X,
  AlertCircle,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Shield,
  Loader2,
  AlertTriangle,
  Award,
  Bell,
  FileText,
  HeartPulse,
  ShieldCheck,
} from 'lucide-react';

import { Modal } from '../../components/common/Modal';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import {
  patientDirectoryService,
  SearchFilterType,
  PatientIdentity,
  AccessScope,
  ALL_ACCESS_SCOPES,
  AccessDuration,
  ACCESS_DURATIONS,
  MockAccessRequestRecord,
} from '../../services/patientDirectoryService';
import {
  ScrollReveal,
  ScrollRevealGroup,
  PremiumCard,
  GlowCard,
} from '../../components/common/ScrollReveal';

interface GrantedEmergencyRecord {
  patientId: string;
  patientHealthId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  doctorRegId: string;
  hospital: string;
  specialization: string;
  qualifications: string;
  experience: string;
  grantedAt: number;
  expiresAt: number;
  reason: string;
  condition: string;
  incident: string;
  status: string;
  criticalInformation?: any;
}

export const DoctorPatientsPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { t, localizeValue } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const doctorId = user?.doctor?.id || user?.id || '';
  const doctorName = user?.doctor?.fullName || user?.name || 'Doctor';
  const doctorSpecialty = user?.doctor?.specialization || 'General Medicine';
  const doctorHospital = user?.doctor?.hospitalAffiliation || 'Apex Health City';
  const doctorRegId = user?.doctor?.registrationNumber || 'Not provided';
  const doctorQualifications = user?.doctor?.qualifications || 'MBBS';
  const doctorExperience = user?.doctor?.experienceYears
    ? `${user.doctor.experienceYears}+ Years Clinical Practice`
    : '5+ Years Clinical Practice';

  // 1. SEARCH FILTER SELECTION (Health ID | Full Name | Aadhaar Number | ABHA ID)
  const [activeFilter, setActiveFilter] = useState<SearchFilterType>('healthId');
  const [searchValue, setSearchValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // 2. SEARCH STATES & RESULTS
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<PatientIdentity[]>([]);

  // 3. SELECTED PATIENT STATE
  const [selectedPatient, setSelectedPatient] = useState<PatientIdentity | null>(null);

  // 4. ACCESS REQUEST MODAL STATE
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [modalPatient, setModalPatient] = useState<PatientIdentity | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<AccessScope[]>([
    'Basic Profile',
    'Medical History',
    'Prescriptions',
    'Reports',
  ]);
  const [clinicalReason, setClinicalReason] = useState('');
  const [accessDuration, setAccessDuration] = useState<AccessDuration>('1 Day');
  const [customHours, setCustomHours] = useState(12);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // 5. EMERGENCY ACCESS MODAL STATE
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyPatient, setEmergencyPatient] = useState<PatientIdentity | null>(null);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [emergencyCondition, setEmergencyCondition] = useState('');
  const [emergencyIncident, setEmergencyIncident] = useState('');
  const [emergencyConfirmed, setEmergencyConfirmed] = useState(false);
  const [isEmergencySubmitting, setIsEmergencySubmitting] = useState(false);
  const [activeEmergencySummary, setActiveEmergencySummary] = useState<GrantedEmergencyRecord | null>(null);

  // 6. PENDING ACCESS TRACKER (Map of patient healthId to mock request)
  const [pendingMap, setPendingMap] = useState<Record<string, MockAccessRequestRecord>>({});

  // Parse initial query params if present (e.g. from Dashboard quick search)
  useEffect(() => {
    const q = searchParams.get('query');
    if (q) {
      setSearchValue(q);
      executeSearch(q, activeFilter);
    }
  }, [searchParams]);

  // Handle Tab Switch
  const handleTabChange = (filter: SearchFilterType) => {
    setActiveFilter(filter);
    setSearchValue('');
    setValidationError(null);
  };

  // Perform search with direct API lookup
  const executeSearch = async (val: string, filter: SearchFilterType) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setValidationError('Please enter a search query');
      return;
    }

    setIsLoading(true);
    setValidationError(null);
    setHasSearched(true);
    setSelectedPatient(null);

    try {
      const results = await patientDirectoryService.searchPatients(filter, trimmed);
      setSearchResults(results);

      if (results.length === 1) {
        setSelectedPatient(results[0]);
      }
    } catch (err: any) {
      setValidationError(err.message || 'Error occurred while querying patient records.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchValue, activeFilter);
  };

  const handleSelectPatient = (patient: PatientIdentity) => {
    setSelectedPatient(patient);
  };

  // Open Normal Access Request Modal
  const handleOpenAccessModal = (patient: PatientIdentity) => {
    setModalPatient(patient);
    setClinicalReason('');
    setSelectedScopes(['Basic Profile', 'Medical History', 'Prescriptions', 'Reports']);
    setAccessDuration('1 Day');
    setIsAccessModalOpen(true);
  };

  // Open Emergency Modal
  const handleOpenEmergencyModal = (patient: PatientIdentity) => {
    setEmergencyPatient(patient);
    setEmergencyReason('');
    setEmergencyCondition('');
    setEmergencyIncident('');
    setEmergencyConfirmed(false);
    setIsEmergencyModalOpen(true);
  };

  // Toggle Scopes
  const handleToggleScope = (scopeId: AccessScope) => {
    if (selectedScopes.includes(scopeId)) {
      if (selectedScopes.length === 1) {
        addToast('warning', 'At least one access scope must be selected.');
        return;
      }
      setSelectedScopes(selectedScopes.filter((s) => s !== scopeId));
    } else {
      setSelectedScopes([...selectedScopes, scopeId]);
    }
  };

  // Submit Normal Access Request
  const handleSubmitAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPatient) return;

    if (!clinicalReason.trim()) {
      addToast('error', 'Clinical reason is required to request EMR access.');
      return;
    }

    if (selectedScopes.length === 0) {
      addToast('error', 'Please select at least one access scope.');
      return;
    }

    setIsSubmittingRequest(true);

    try {
      const response = await patientDirectoryService.submitAccessRequest({
        patientId: modalPatient.id,
        patientHealthId: modalPatient.healthId,
        patientName: modalPatient.fullName,
        doctorId,
        doctorName,
        doctorSpecialty,
        doctorHospital,
        scopes: selectedScopes,
        clinicalReason: clinicalReason.trim(),
        duration: accessDuration,
        customHours: accessDuration === 'Custom' ? customHours : undefined,
      });

      if (response.success) {
        addToast(
          'success',
          'EMR access request sent to patient. Status: PENDING. Records remain locked until patient approval.'
        );

        setPendingMap((prev) => ({
          ...prev,
          [modalPatient.healthId]: {
            patientId: modalPatient.id,
            patientHealthId: modalPatient.healthId,
            patientName: modalPatient.fullName,
            doctorId,
            doctorName,
            scopes: selectedScopes,
            clinicalReason: clinicalReason.trim(),
            duration: accessDuration,
            requestId: response.requestId,
            status: 'PENDING',
            requestedAt: Date.now(),
          },
        }));

        setIsAccessModalOpen(false);
        setModalPatient(null);
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to submit access request.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Submit Emergency Access
  const handleGrantEmergencyAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyPatient) return;

    if (!emergencyReason.trim()) {
      addToast('error', 'Emergency reason is required.');
      return;
    }

    if (!emergencyCondition.trim()) {
      addToast('error', 'Current patient condition / incident is required.');
      return;
    }

    if (!emergencyConfirmed) {
      addToast('error', 'Please confirm that this is a genuine medical emergency.');
      return;
    }

    setIsEmergencySubmitting(true);

    try {
      const res = await api.initiateEmergencyAccess({
        healthId: emergencyPatient.healthId,
        reason: emergencyReason.trim(),
        condition: emergencyCondition.trim(),
        incident: emergencyIncident.trim(),
        confirmation: true,
      });

      if (res && res.success) {
        const now = Date.now();
        const expires = now + 2 * 3600 * 1000; // EXACTLY 2 Hours
        const newGrant: GrantedEmergencyRecord = {
          patientId: emergencyPatient.id,
          patientHealthId: emergencyPatient.healthId,
          patientName: emergencyPatient.fullName,
          doctorId,
          doctorName,
          doctorRegId,
          hospital: doctorHospital,
          specialization: doctorSpecialty,
          qualifications: doctorQualifications,
          experience: doctorExperience,
          grantedAt: now,
          expiresAt: expires,
          reason: emergencyReason.trim(),
          condition: emergencyCondition.trim(),
          incident: emergencyIncident.trim(),
          status: 'EMERGENCY_ACTIVE',
          criticalInformation: res.criticalInformation,
        };

        setIsEmergencySubmitting(false);
        setIsEmergencyModalOpen(false);
        setActiveEmergencySummary(newGrant);

        addToast(
          'success',
          `Emergency Access Granted for ${emergencyPatient.fullName}. 2-Hour Limited Emergency Access is Active.`
        );

        setSelectedPatient((prev) => (prev ? { ...prev, accessStatus: 'EMERGENCY_ACTIVE' } : null));
      } else {
        addToast('error', res?.message || 'Emergency access denied.');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Emergency access initiation failed.');
    } finally {
      setIsEmergencySubmitting(false);
    }
  };

  const getFilterConfig = () => {
    switch (activeFilter) {
      case 'healthId':
        return {
          placeholder: 'Enter Health ID (e.g. APEX-123456)',
          inputLabel: 'PATIENT HEALTH ID',
        };
      case 'fullName':
        return {
          placeholder: 'Enter full name (e.g. John Doe)',
          inputLabel: 'FULL CITIZEN NAME',
        };
      case 'aadhaar':
        return {
          placeholder: 'Enter 12-digit Aadhaar Number',
          inputLabel: 'AADHAAR NUMBER',
        };
      case 'abhaId':
        return {
          placeholder: 'Enter ABHA ID (e.g. 91-XXXX-XXXX-XXXX)',
          inputLabel: 'ABHA NUMBER',
        };
      default:
        return {
          placeholder: 'Enter patient identifier...',
          inputLabel: 'PATIENT IDENTIFIER',
        };
    }
  };

  const currentConfig = getFilterConfig();

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-24 text-white antialiased">
      {/* Header */}
      <ScrollReveal direction="left">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <span>Patient Search & Access Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 tracking-tight">
            Patient Directory & EMR Access
          </h1>
          <p className="text-xs sm:text-sm text-white/50 mt-1 max-w-2xl">
            Search registered citizens from PostgreSQL and request permission-controlled or emergency EMR access.
          </p>
        </div>
      </ScrollReveal>

      {/* Main Search Panel */}
      <ScrollReveal direction="bottom" delay={0.08}>
        <div className="bg-[#0B0B0D] p-5 sm:p-8 rounded-[32px] border border-white/[0.08] shadow-2xl space-y-6">
          {/* Search Type Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/40 mb-2.5">
              SEARCH TYPE
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              {(
                [
                  { id: 'healthId', label: 'Health ID' },
                  { id: 'fullName', label: 'Full Name' },
                  { id: 'aadhaar', label: 'Aadhaar Number' },
                  { id: 'abhaId', label: 'ABHA ID' },
                ] as { id: SearchFilterType; label: string }[]
              ).map((tab) => {
                const isActive = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 text-center truncate cursor-pointer ${
                      isActive
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                        : 'text-white/50 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Search Input & Button */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60">
                {currentConfig.inputLabel}
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder={currentConfig.placeholder}
                  className={`w-full pl-12 pr-10 py-3.5 rounded-2xl border bg-white/[0.04] text-sm font-semibold text-white transition-colors focus:outline-none ${
                    validationError
                      ? 'border-rose-500/50 focus:border-rose-500'
                      : 'border-white/10 focus:border-teal-500'
                  }`}
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchValue('');
                      setValidationError(null);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
                    title="Clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search Patient</span>
                  </>
                )}
              </button>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-300 bg-rose-500/10 p-3.5 rounded-2xl border border-rose-500/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{validationError}</span>
              </div>
            )}
          </form>
        </div>
      </ScrollReveal>

      {/* SELECTED PATIENT PREVIEW & ACTION CARDS */}
      {selectedPatient && (
        <ScrollReveal direction="bottom">
          <div className="bg-[#0B0B0D] p-6 sm:p-8 rounded-[32px] border border-teal-500/30 shadow-2xl space-y-6">
            {/* Patient Identity Top Summary */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-4">
                <ProfileAvatar
                  photoUrl={selectedPatient.photoUrl}
                  name={selectedPatient.fullName}
                  role="PATIENT"
                  size="lg"
                  shape="rounded"
                  className="shadow-md border-2 border-teal-500/30"
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-xl font-black text-white">
                      {selectedPatient.fullName}
                    </h2>
                    <span className="font-mono text-xs font-bold text-teal-300 bg-teal-500/10 px-3 py-0.5 rounded-md border border-teal-500/20">
                      {selectedPatient.healthId}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Verified</span>
                    </span>
                  </div>
                  <div className="text-xs text-white/50 flex items-center gap-2">
                    <Fingerprint className="w-3.5 h-3.5 text-teal-400" />
                    <span>
                      Identification Marks:{' '}
                      {selectedPatient.identificationMarks.length > 0
                        ? selectedPatient.identificationMarks.join(', ')
                        : 'Not added yet'}
                    </span>
                  </div>
                </div>
              </div>

              {selectedPatient.accessStatus === 'AUTHORIZED' && (
                <button
                  type="button"
                  onClick={() => navigate(`/doctor/current-patient/${selectedPatient.id}`)}
                  className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>OPEN CURRENT PATIENT</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* AUTHORIZED PATIENT CARD vs ACTION CARDS */}
            {selectedPatient.accessStatus === 'AUTHORIZED' ? (
              <div className="p-6 rounded-[28px] bg-emerald-500/10 border border-emerald-500/30 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4" />
                      <span>AUTHORIZED PATIENT</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      Active EMR Clearance Granted
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                      <span className="flex items-center gap-1 font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Access: <strong>ACTIVE</strong></span>
                      </span>
                      <span>•</span>
                      <span>Scope: <strong className="text-white">{selectedPatient.activePermission?.approvedScope || 'Approved Scopes'}</strong></span>
                      <span>•</span>
                      <span>Expires: <strong className="text-white">{selectedPatient.activePermission?.expiresAt ? new Date(selectedPatient.activePermission.expiresAt).toLocaleString() : 'Active'}</strong></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/doctor/current-patient/${selectedPatient.id}`)}
                    className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>OPEN CURRENT PATIENT</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* CARD 1: NORMAL EMR ACCESS */}
                <div className="p-6 rounded-[28px] bg-[#101012] border border-teal-500/20 shadow-lg space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
                      <Lock className="w-4 h-4" />
                      <span>NORMAL EMR ACCESS</span>
                    </div>
                    <h3 className="text-base font-bold text-white">
                      Consent-Based Record Clearance
                    </h3>
                    <p className="text-xs text-white/50 leading-relaxed">
                      Request structured access to patient's medical records. Patient receives an in-app notification to review and approve your requested scope and duration.
                    </p>
                  </div>

                  <div className="pt-2">
                    {pendingMap[selectedPatient.healthId] ? (
                      <div className="w-full py-3 px-4 rounded-2xl bg-amber-500/10 text-amber-300 font-bold text-xs border border-amber-500/20 flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span>Access Request Pending Patient Approval</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenAccessModal(selectedPatient)}
                        className="w-full py-3 px-5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Lock className="w-4 h-4" />
                        <span>REQUEST EMR ACCESS</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* CARD 2: EMERGENCY ACCESS */}
                <div className="p-6 rounded-[28px] bg-[#1A0A0E] border border-rose-500/30 shadow-lg space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4" />
                      <span>EMERGENCY ACCESS</span>
                    </div>
                    <h3 className="text-base font-bold text-white">
                      Critical Trauma & Triage Override
                    </h3>
                    <p className="text-xs text-rose-300/60 leading-relaxed">
                      For genuine life-threatening emergencies only. Unlocks 2-hour limited critical clinical data (Blood group, allergies, critical conditions, emergency contacts) with mandatory audit logging.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEmergencyModal(selectedPatient)}
                      className="w-full py-3 px-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>EMERGENCY ACCESS</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollReveal>
      )}

      {/* RESULTS LIST */}
      <div className="space-y-6">
        {/* Initial state */}
        {!hasSearched && !isLoading && (
          <ScrollReveal direction="bottom">
            <div className="bg-[#0B0B0D] p-12 text-center rounded-[32px] border border-white/[0.08] space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/20">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">
                Search the database to locate a patient
              </h3>
              <p className="text-xs text-white/50 max-w-md mx-auto">
                Select Health ID, Full Name, Aadhaar Number, or ABHA ID to search registered patients.
              </p>
            </div>
          </ScrollReveal>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="bg-[#0B0B0D] p-6 rounded-[32px] border border-white/[0.08] space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.05]" />
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-white/[0.05] rounded-md w-1/2" />
                    <div className="h-4 bg-white/[0.05] rounded-md w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results state */}
        {hasSearched && !isLoading && searchResults.length === 0 && (
          <ScrollReveal direction="bottom">
            <div className="bg-[#0B0B0D] p-12 text-center rounded-[32px] border border-white/[0.08] space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">
                No patient found in database
              </h3>
              <p className="text-xs text-white/50 max-w-sm mx-auto">
                No registered patient matched query "{searchValue}". Please check the identifier.
              </p>
            </div>
          </ScrollReveal>
        )}

        {/* Multiple results found */}
        {hasSearched && !isLoading && searchResults.length > 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-white/50 font-semibold px-1">
              <span>Found {searchResults.length} matching patients</span>
              <span className="text-teal-400">Click a patient to select</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {searchResults.map((patient, idx) => {
                const isSelected = selectedPatient?.id === patient.id;
                return (
                  <ScrollReveal key={patient.id} direction={idx % 2 === 0 ? 'left' : 'right'} delay={idx * 0.05}>
                    <div
                      onClick={() => handleSelectPatient(patient)}
                      className={`bg-[#0B0B0D] rounded-[28px] border p-6 space-y-4 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-xl'
                          : 'border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <ProfileAvatar
                          photoUrl={patient.photoUrl}
                          name={patient.fullName}
                          role="PATIENT"
                          size="lg"
                          shape="rounded"
                          className="shadow-sm border-2 border-white/10 flex-shrink-0"
                        />
                        <div className="space-y-1 flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-white truncate">
                            {patient.fullName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-teal-300 bg-teal-500/10 px-2.5 py-0.5 rounded-md border border-teal-500/20">
                              {patient.healthId}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Verified</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-xs text-white/60">
                        <strong className="text-white">Marks:</strong>{' '}
                        {patient.identificationMarks.length > 0
                          ? patient.identificationMarks.join(', ')
                          : 'Not added yet'}
                      </div>

                      <button
                        type="button"
                        className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                          isSelected ? 'bg-teal-700 text-white' : 'bg-teal-600 hover:bg-teal-500 text-white'
                        }`}
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>{isSelected ? '✓ Selected Patient' : 'Select This Patient'}</span>
                      </button>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* NORMAL ACCESS REQUEST MODAL */}
      {modalPatient && (
        <Modal
          isOpen={isAccessModalOpen}
          onClose={() => {
            if (!isSubmittingRequest) {
              setIsAccessModalOpen(false);
              setModalPatient(null);
            }
          }}
          title={`Request EMR Access: ${modalPatient.fullName} (${modalPatient.healthId})`}
        >
          <form onSubmit={handleSubmitAccessRequest} className="space-y-5 text-xs text-white">
            <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center gap-3">
              <ProfileAvatar
                photoUrl={modalPatient.photoUrl}
                name={modalPatient.fullName}
                role="PATIENT"
                size="md"
                shape="rounded"
              />
              <div>
                <div className="font-bold text-sm text-white">
                  {modalPatient.fullName}
                </div>
                <div className="font-mono text-xs font-semibold text-teal-400">
                  {modalPatient.healthId}
                </div>
              </div>
            </div>

            {/* Scopes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                Access Scope *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 custom-scrollbar">
                {ALL_ACCESS_SCOPES.map((scope) => {
                  const isChecked = selectedScopes.includes(scope.id);
                  return (
                    <label
                      key={scope.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-teal-500/20 border-teal-500/40 text-teal-200 font-semibold'
                          : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/[0.05]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleScope(scope.id)}
                        className="rounded text-teal-500 focus:ring-teal-500 w-4 h-4 bg-transparent border-white/20"
                      />
                      <span className="text-xs">{scope.id}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Clinical Reason */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                Clinical Reason *
              </label>
              <textarea
                value={clinicalReason}
                onChange={(e) => setClinicalReason(e.target.value)}
                placeholder="Enter clinical reason for requesting record access..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white focus:border-teal-500 text-xs focus:outline-none"
                rows={3}
                required
              />
            </div>

            {/* Access Duration */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1.5">
                Access Duration
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {ACCESS_DURATIONS.map((dur) => {
                  const isSelected = accessDuration === dur.label;
                  return (
                    <button
                      key={dur.label}
                      type="button"
                      onClick={() => setAccessDuration(dur.label)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'bg-white/[0.04] text-white/70 hover:bg-white/[0.08] border border-white/10'
                      }`}
                    >
                      {dur.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5 border-t border-white/[0.08]">
              <button
                type="button"
                disabled={isSubmittingRequest}
                onClick={() => {
                  setIsAccessModalOpen(false);
                  setModalPatient(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-white/70 hover:bg-white/[0.05] font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingRequest}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmittingRequest ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <span>SEND ACCESS REQUEST</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EMERGENCY ACCESS FORM MODAL */}
      {emergencyPatient && (
        <Modal
          isOpen={isEmergencyModalOpen}
          onClose={() => {
            if (!isEmergencySubmitting) {
              setIsEmergencyModalOpen(false);
              setEmergencyPatient(null);
            }
          }}
          title="🚨 Emergency Medical Access Form"
        >
          <form onSubmit={handleGrantEmergencyAccess} className="space-y-5 text-xs text-white">
            {/* Selected Patient */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
              <ProfileAvatar
                photoUrl={emergencyPatient.photoUrl}
                name={emergencyPatient.fullName}
                role="PATIENT"
                size="md"
                shape="rounded"
              />
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="font-bold text-sm text-white truncate">
                  {emergencyPatient.fullName}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-teal-400">
                    {emergencyPatient.healthId}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Doctor Identity */}
            <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 space-y-1 text-white/70 text-[11px]">
              <div>Doctor: <strong className="text-white">{doctorName}</strong></div>
              <div>Medical Licence: <strong className="font-mono text-teal-400">{doctorRegId}</strong></div>
              <div>Hospital: <span>{doctorHospital}</span></div>
            </div>

            {/* Mandatory Fields */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                Emergency Reason *
              </label>
              <textarea
                value={emergencyReason}
                onChange={(e) => setEmergencyReason(e.target.value)}
                placeholder="e.g. Patient unconscious after vehicular accident..."
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs focus:border-rose-500 focus:outline-none"
                rows={2}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/60 mb-1">
                Current Condition / Incident *
              </label>
              <textarea
                value={emergencyCondition}
                onChange={(e) => setEmergencyCondition(e.target.value)}
                placeholder="e.g. Unresponsive, possible trauma, blood pressure dropping..."
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs focus:border-rose-500 focus:outline-none"
                rows={2}
                required
              />
            </div>

            {/* Mandatory Confirmation Checkbox */}
            <label className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 cursor-pointer">
              <input
                type="checkbox"
                checked={emergencyConfirmed}
                onChange={(e) => setEmergencyConfirmed(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 bg-transparent border-rose-500/30"
                required
              />
              <span className="text-xs font-semibold text-rose-200">
                I confirm this is a genuine emergency and emergency access is required.
              </span>
            </label>

            <div className="pt-2 flex justify-end gap-2.5 border-t border-white/[0.08]">
              <button
                type="button"
                disabled={isEmergencySubmitting}
                onClick={() => {
                  setIsEmergencyModalOpen(false);
                  setEmergencyPatient(null);
                }}
                className="px-4 py-2 rounded-xl border border-white/10 text-white/70 hover:bg-white/[0.05] font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isEmergencySubmitting || !emergencyConfirmed || !emergencyReason.trim() || !emergencyCondition.trim()}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isEmergencySubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying & Initiating...</span>
                  </>
                ) : (
                  <span>INITIATE EMERGENCY ACCESS</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EMERGENCY ACCESS ACTIVE SUMMARY MODAL */}
      {activeEmergencySummary && (
        <Modal
          isOpen={true}
          onClose={() => setActiveEmergencySummary(null)}
          title="🚨 Emergency Access Active"
        >
          <div className="space-y-4 text-xs text-white">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-200">
                  Emergency Override Session Activated
                </h4>
                <p className="text-emerald-400 text-xs">
                  Valid for EXACTLY 2 Hours • High-Priority Audit Log Created
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5 text-white/80">
              <div><strong>Patient:</strong> {activeEmergencySummary.patientName} ({activeEmergencySummary.patientHealthId})</div>
              <div><strong>Reason:</strong> {activeEmergencySummary.reason}</div>
              <div><strong>Doctor:</strong> {activeEmergencySummary.doctorName} ({activeEmergencySummary.doctorRegId})</div>
              <div><strong>Auto-Expiry:</strong> {new Date(activeEmergencySummary.expiresAt).toLocaleTimeString()} (2 Hours)</div>
            </div>

            {activeEmergencySummary.criticalInformation && (
              <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 space-y-2">
                <span className="text-[10px] uppercase font-bold text-teal-300">
                  Unlocked Critical Information
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-white/70">
                  <div><strong>Blood Group:</strong> {activeEmergencySummary.criticalInformation.bloodGroup || 'Unknown'}</div>
                  <div><strong>Allergies:</strong> {activeEmergencySummary.criticalInformation.allergies?.length || 0} recorded</div>
                  <div><strong>Active Conditions:</strong> {activeEmergencySummary.criticalInformation.conditions?.length || 0}</div>
                  <div><strong>Active Medicines:</strong> {activeEmergencySummary.criticalInformation.currentMedicines?.length || 0}</div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveEmergencySummary(null);
                  navigate(`/doctor/patients/${activeEmergencySummary.patientId}/emr`);
                }}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Open Emergency EMR View
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DoctorPatientsPage;
