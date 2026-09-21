import React, { useState, useEffect } from 'react';
import {
  Link2,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Building2,
  User,
  Stethoscope,
  Eye,
  X,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Check,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import {
  blockchainProofService,
  PatientProofCard,
  DoctorProofCard,
  RecordVerificationResult,
  RecordHistoryItem,
  VerificationState,
} from '../../services/blockchainProofService';
import { ScrollReveal, ScrollRevealGroup } from '../../components/common/ScrollReveal';

export const AdminBlockchainPage: React.FC = () => {
  // Search mode state: 'PATIENT' or 'DOCTOR'
  const [searchMode, setSearchMode] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [searchQuery, setSearchQuery] = useState('Rahul Sharma');

  // Search results
  const [patientResults, setPatientResults] = useState<PatientProofCard[]>([]);
  const [doctorResults, setDoctorResults] = useState<DoctorProofCard[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Verification state
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>('REC-HYPERTENSION-01');
  const [isChecking, setIsChecking] = useState(false);
  const [verificationResult, setVerificationResult] = useState<RecordVerificationResult | null>(null);
  const [recordHistory, setRecordHistory] = useState<RecordHistoryItem[]>([]);

  // Selected doctor view for doctor search results (Section 9)
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProofCard | null>(null);

  // Modal detail view
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Initial load with default search
  useEffect(() => {
    handleSearch('Rahul Sharma', 'PATIENT');
  }, []);

  const handleSearch = async (queryToUse?: string, modeToUse?: 'PATIENT' | 'DOCTOR') => {
    const q = (queryToUse !== undefined ? queryToUse : searchQuery).trim();
    const mode = modeToUse || searchMode;
    setIsSearching(true);
    setHasSearched(true);
    setSelectedDoctor(null);

    try {
      if (mode === 'PATIENT') {
        const results = await blockchainProofService.searchPatients(q);
        setPatientResults(results);
        setDoctorResults([]);

        // If results found, auto-check first record for immediate preview
        if (results.length > 0 && results[0].availableRecords.length > 0) {
          const recId = results[0].availableRecords[0].id;
          setSelectedRecordId(recId);
          await runCheckRecord(recId);
        } else {
          setVerificationResult(null);
          setRecordHistory([]);
        }
      } else {
        const results = await blockchainProofService.searchDoctors(q);
        setDoctorResults(results);
        setPatientResults([]);
        if (results.length > 0) {
          setSelectedDoctor(results[0]);
        }
        setVerificationResult(null);
        setRecordHistory([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const runCheckRecord = async (recordId: string) => {
    setSelectedRecordId(recordId);
    setIsChecking(true);
    try {
      const [res, hist] = await Promise.all([
        blockchainProofService.checkPatientRecord(recordId),
        blockchainProofService.getRecordHistory(recordId),
      ]);
      setVerificationResult(res);
      setRecordHistory(hist);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  // Quick chip click
  const handleQuickSearch = (term: string, mode: 'PATIENT' | 'DOCTOR') => {
    setSearchMode(mode);
    setSearchQuery(term);
    handleSearch(term, mode);
  };

  // Render Result State Badge
  const renderStateBadge = (state: VerificationState) => {
    switch (state) {
      case 'AUTHORIZED_CHANGE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>🟢 Authorized Change</span>
          </span>
        );
      case 'UNAUTHORIZED_MODIFICATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>🔴 Unauthorized Modification</span>
          </span>
        );
      case 'AUTHORIZED_BUT_CHANGED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>🟡 Authorized but Changed</span>
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 antialiased text-white">
      {/* ==================================================
          SECTION 1: SIMPLE SEARCH & HEADER
          ================================================== */}
      <ScrollReveal direction="bottom">
        <div className="space-y-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-semibold mb-2">
              <Link2 className="w-3.5 h-3.5 text-blue-400" />
              <span>⛓️ Blockchain Proof</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Check Medical Record
            </h1>
            <p className="text-sm text-white/60 mt-1 max-w-3xl">
              Search for a patient or doctor to check the authenticity and history of medical record changes.
            </p>
          </div>

          {/* Search Mode Toggles & Input Container */}
          <div className="bg-[#0B0B0D] p-4 sm:p-6 rounded-[24px] border border-white/10 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setSearchMode('PATIENT');
                  setSearchQuery('');
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  searchMode === 'PATIENT'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40 border border-blue-500/30'
                    : 'bg-[#101012] text-white/60 hover:text-white hover:bg-white/5 border border-white/5'
                }`}
              >
                Search by Patient Name or Health ID
              </button>
              <button
                onClick={() => {
                  setSearchMode('DOCTOR');
                  setSearchQuery('');
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  searchMode === 'DOCTOR'
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-950/40 border border-teal-500/30'
                    : 'bg-[#101012] text-white/60 hover:text-white hover:bg-white/5 border border-white/5'
                }`}
              >
                Search by Doctor ID
              </button>
            </div>

            {/* Search Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
            >
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    searchMode === 'PATIENT'
                      ? 'Search by Patient Name or Health ID (e.g. Rahul Sharma, HP-100245)...'
                      : 'Search by Doctor ID or Name (e.g. DOC-20481, Dr. Ananya Sharma)...'
                  }
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/10 bg-[#141416] text-white text-sm focus:border-blue-500 outline-none transition-all placeholder-white/40"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Search className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                <span>Search</span>
              </button>
            </form>

            {/* Quick Suggestions / Test Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-white/40 font-medium">Quick Test:</span>
              <button
                onClick={() => handleQuickSearch('Rahul Sharma', 'PATIENT')}
                className="px-2.5 py-1 rounded-lg bg-[#141416] hover:bg-white/5 border border-white/10 text-white/80 transition-colors"
              >
                Rahul Sharma
              </button>
              <button
                onClick={() => handleQuickSearch('HP-100245', 'PATIENT')}
                className="px-2.5 py-1 rounded-lg bg-[#141416] hover:bg-white/5 border border-white/10 text-cyan-400 font-mono transition-colors"
              >
                HP-100245
              </button>
              <button
                onClick={() => handleQuickSearch('DOC-20481', 'DOCTOR')}
                className="px-2.5 py-1 rounded-lg bg-[#141416] hover:bg-white/5 border border-white/10 text-teal-400 font-mono transition-colors"
              >
                DOC-20481
              </button>
              <button
                onClick={() => handleQuickSearch('Dr. Ananya Sharma', 'DOCTOR')}
                className="px-2.5 py-1 rounded-lg bg-[#141416] hover:bg-white/5 border border-white/10 text-white/80 transition-colors"
              >
                Dr. Ananya Sharma
              </button>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ==================================================
          SECTION 2: SEARCH RESULTS (PATIENT & DOCTOR CARDS)
          ================================================== */}
      {hasSearched && (
        <div className="space-y-6">
          {/* Patient Search Results */}
          {searchMode === 'PATIENT' && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white/50">
                Patient Search Results ({patientResults.length})
              </h2>

              {patientResults.length === 0 ? (
                <div className="p-8 text-center bg-[#0B0B0D] rounded-[24px] border border-white/10">
                  <p className="text-sm font-bold text-white">
                    No matching patient found
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    Try searching by name (e.g. "Rahul Sharma") or Health ID (e.g. "HP-100245").
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patientResults.map((patient) => (
                    <div
                      key={patient.id}
                      className="bg-[#0B0B0D] rounded-[24px] border border-white/10 p-5 sm:p-6 shadow-lg space-y-4 hover:border-blue-500/40 transition-all"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          <span>Patient</span>
                        </span>
                        {patient.isVerified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>✓ Verified</span>
                          </span>
                        )}
                      </div>

                      {/* Photo & Name */}
                      <div className="flex items-center gap-4">
                        <ProfileAvatar
                          photoUrl={patient.photoUrl}
                          name={patient.name}
                          role="PATIENT"
                          size="lg"
                          className="rounded-2xl ring-1 ring-white/10 shadow-xs"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-white truncate">
                            {patient.name}
                          </h3>
                          <p className="text-xs text-white/50 mt-0.5">
                            Health ID:{' '}
                            <span className="font-mono font-bold text-cyan-400">
                              {patient.healthId}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Patient Meta */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-[#101012] p-3 rounded-2xl border border-white/5">
                        <div>
                          <span className="text-white/40 block">
                            Prescription Records:
                          </span>
                          <span className="font-bold text-white text-sm">
                            {patient.prescriptionRecordsCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/40 block">
                            Last Updated:
                          </span>
                          <span className="font-medium text-white/70 text-xs flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-white/40" />
                            <span>{patient.lastUpdated}</span>
                          </span>
                        </div>
                      </div>

                      {/* Record Options for this patient */}
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
                          Checkable Records:
                        </span>
                        <div className="space-y-1.5">
                          {patient.availableRecords.map((rec) => (
                            <div
                              key={rec.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                                selectedRecordId === rec.id
                                  ? 'bg-blue-500/10 border-blue-500/30'
                                  : 'bg-[#141416] border-white/5 hover:border-white/10'
                              }`}
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <p className="font-semibold text-white truncate">
                                  {rec.title}
                                </p>
                                <span className="text-[10px] text-white/40">
                                  {rec.category}
                                </span>
                              </div>
                              <button
                                onClick={() => runCheckRecord(rec.id)}
                                disabled={isChecking && selectedRecordId === rec.id}
                                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all flex-shrink-0 cursor-pointer border border-white/10 disabled:opacity-50"
                              >
                                {isChecking && selectedRecordId === rec.id
                                  ? 'Checking...'
                                  : 'Check Record'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Doctor Search Results */}
          {searchMode === 'DOCTOR' && (
            <div className="space-y-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white/50">
                Doctor Search Results ({doctorResults.length})
              </h2>

              {doctorResults.length === 0 ? (
                <div className="p-8 text-center bg-[#0B0B0D] rounded-[24px] border border-white/10">
                  <p className="text-sm font-bold text-white">
                    No matching doctor found
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    Try searching by Doctor ID (e.g. "DOC-20481") or Doctor name.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctorResults.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-[#0B0B0D] rounded-[24px] border border-white/10 p-5 sm:p-6 shadow-lg space-y-4 hover:border-teal-500/40 transition-all"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                          <span>Doctor</span>
                        </span>
                        {doc.isVerified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>✓ Verified</span>
                          </span>
                        )}
                      </div>

                      {/* Photo & Name */}
                      <div className="flex items-center gap-4">
                        <ProfileAvatar
                          photoUrl={doc.photoUrl}
                          name={doc.name}
                          role="DOCTOR"
                          size="lg"
                          className="rounded-2xl ring-1 ring-white/10 shadow-xs"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-white truncate">
                            {doc.name}
                          </h3>
                          <p className="text-xs text-white/50 mt-0.5">
                            Doctor ID:{' '}
                            <span className="font-mono font-bold text-teal-300">
                              {doc.doctorId}
                            </span>
                          </p>
                          <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5 truncate">
                            <Building2 className="w-3 h-3 text-white/40 flex-shrink-0" />
                            <span className="truncate">{doc.hospital}</span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#101012] p-3 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-white/50">Records Updated:</span>
                        <span className="font-bold text-white text-sm">
                          {doc.recordsUpdatedCount}
                        </span>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => {
                            setSelectedDoctor(doc);
                            if (doc.changedRecords.length > 0) {
                              runCheckRecord(doc.changedRecords[0].recordId);
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5 border border-white/10"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Check Records</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Section 9: Records Changed by This Doctor */}
              {selectedDoctor && (
                <div className="bg-[#0B0B0D] p-5 sm:p-6 rounded-[24px] border border-white/10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Records Changed by This Doctor
                      </h3>
                      <p className="text-xs text-white/50">
                        Doctor: {selectedDoctor.name} ({selectedDoctor.doctorId}) • {selectedDoctor.hospital}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
                      ✓ Doctor Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedDoctor.changedRecords.map((item) => (
                      <div
                        key={item.recordId}
                        className={`p-4 rounded-2xl bg-[#101012] border transition-all space-y-3 shadow-xs ${
                          selectedRecordId === item.recordId
                            ? 'border-blue-500/50 ring-1 ring-blue-500/30'
                            : 'border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">
                            {item.patientName}
                          </h4>
                          <span className="text-xs font-mono font-bold text-cyan-400">
                            {item.healthId}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          <span className="text-white/40 block">Category:</span>
                          <span className="font-semibold text-white/80 block">
                            {item.category}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-white/70">
                            {item.stateLabel}
                          </span>
                          <button
                            onClick={() => runCheckRecord(item.recordId)}
                            disabled={isChecking && selectedRecordId === item.recordId}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all cursor-pointer border border-white/10 disabled:opacity-50"
                          >
                            {isChecking && selectedRecordId === item.recordId
                              ? 'Checking...'
                              : 'Check Record'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ==================================================
          SECTION 3, 4, 5, 6, 7: VERIFICATION RESULT CARD
          ================================================== */}
      {isChecking && (
        <div className="p-8 sm:p-12 text-center bg-[#0B0B0D] rounded-[24px] border border-white/10 shadow-lg space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
          <p className="text-base font-bold text-white">
            Checking record history...
          </p>
          <p className="text-xs text-white/50">
            Verifying doctor authorization status, patient consent, and recorded changes.
          </p>
        </div>
      )}

      {!isChecking && verificationResult && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white/50">
              Record Verification Result
            </h2>
            <span className="text-xs text-cyan-400 font-mono">
              {verificationResult.recordId}
            </span>
          </div>

          {/* MAIN VERIFICATION CARD */}
          <div
            className={`bg-[#0B0B0D] rounded-[24px] p-6 sm:p-8 border shadow-lg space-y-6 transition-all ${
              verificationResult.state === 'AUTHORIZED_CHANGE'
                ? 'border-emerald-500/30'
                : verificationResult.state === 'UNAUTHORIZED_MODIFICATION'
                ? 'border-rose-500/30'
                : 'border-amber-500/30'
            }`}
          >
            {/* Top Row: State Banner & Description */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <div className="space-y-1">
                {renderStateBadge(verificationResult.state)}
                <p className="text-sm sm:text-base font-bold text-white pt-1">
                  "{verificationResult.stateDescription}"
                </p>
              </div>

              <button
                onClick={() => setShowDetailModal(true)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-center cursor-pointer border border-white/10"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Details</span>
              </button>
            </div>

            {/* Grid 1: Patient & Changed By side-by-side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Patient Block */}
              <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
                  Patient
                </span>
                <div className="flex items-center gap-3">
                  <ProfileAvatar
                    photoUrl={verificationResult.patient.photoUrl}
                    name={verificationResult.patient.name}
                    role="PATIENT"
                    size="md"
                    className="rounded-xl shadow-xs"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {verificationResult.patient.name}
                    </h4>
                    <p className="text-xs text-white/50">
                      Health ID:{' '}
                      <span className="font-mono font-bold text-cyan-400">
                        {verificationResult.patient.healthId}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Changed By Block */}
              <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
                  Changed By
                </span>
                <div className="flex items-center gap-3">
                  <ProfileAvatar
                    photoUrl={verificationResult.changedBy.photoUrl}
                    name={verificationResult.changedBy.name}
                    role="DOCTOR"
                    size="md"
                    className="rounded-xl shadow-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate">
                      {verificationResult.changedBy.name}
                    </h4>
                    {verificationResult.changedBy.doctorId && (
                      <p className="text-xs text-white/50 truncate">
                        Doctor ID:{' '}
                        <span className="font-mono font-bold text-teal-300">
                          {verificationResult.changedBy.doctorId}
                        </span>
                      </p>
                    )}
                    {verificationResult.changedBy.hospital && (
                      <p className="text-xs text-white/50 truncate">
                        {verificationResult.changedBy.hospital}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2: What Changed, Previous vs Updated */}
            <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
                    What Changed
                  </span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {verificationResult.whatChanged}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
                    Changed On
                  </span>
                  <p className="text-xs font-semibold text-white/70 mt-0.5 flex items-center gap-1 justify-end">
                    <Clock className="w-3.5 h-3.5 text-white/40" />
                    <span>{verificationResult.changedOn}</span>
                  </p>
                </div>
              </div>

              {/* Previous vs Updated Comparison */}
              {(verificationResult.previousValue || verificationResult.updatedValue) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/5 text-xs">
                  {verificationResult.previousValue && (
                    <div className="p-3 rounded-xl bg-[#0B0B0D] border border-white/5">
                      <span className="text-[10px] font-semibold text-white/40 uppercase block mb-1">
                        Previous:
                      </span>
                      <p className="font-semibold text-rose-400 line-through opacity-75">
                        {verificationResult.previousValue}
                      </p>
                    </div>
                  )}
                  {verificationResult.updatedValue && (
                    <div className="p-3 rounded-xl bg-[#0B0B0D] border border-white/5">
                      <span className="text-[10px] font-semibold text-white/40 uppercase block mb-1">
                        Updated:
                      </span>
                      <p className="font-bold text-emerald-400">
                        {verificationResult.updatedValue}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Reason */}
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-0.5">
                  Reason:
                </span>
                <p className="text-xs text-white/80 font-medium">
                  {verificationResult.reason}
                </p>
              </div>
            </div>

            {/* Grid 3: Permission, Audit, Record Integrity Status Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Permission */}
              <div className="p-3.5 rounded-2xl bg-[#101012] border border-white/5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
                  Doctor Permission
                </span>
                <span
                  className={`text-xs font-bold block ${
                    verificationResult.permission.includes('✓')
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {verificationResult.permission}
                </span>
              </div>

              {/* Audit */}
              <div className="p-3.5 rounded-2xl bg-[#101012] border border-white/5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
                  Audit Status
                </span>
                <span
                  className={`text-xs font-bold block ${
                    verificationResult.audit.includes('✓')
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {verificationResult.audit}
                </span>
              </div>

              {/* Record Integrity */}
              <div className="p-3.5 rounded-2xl bg-[#101012] border border-white/5 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">
                  Record Integrity
                </span>
                <span
                  className={`text-xs font-bold block ${
                    verificationResult.recordIntegrity.includes('✓')
                      ? 'text-emerald-400'
                      : verificationResult.recordIntegrity.includes('Failed')
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  {verificationResult.recordIntegrity}
                </span>
              </div>
            </div>

            {/* System Actions if present */}
            {verificationResult.systemActions && verificationResult.systemActions.length > 0 && (
              <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
                  System Action:
                </span>
                {verificationResult.systemActions.map((act, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md bg-[#141416] text-white/80 border border-white/10"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{act}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ==================================================
              SECTION 8: RECORD HISTORY TIMELINE
              ================================================== */}
          <div className="bg-[#0B0B0D] rounded-[24px] p-6 sm:p-8 border border-white/10 shadow-lg space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div>
                <h3 className="text-base font-bold text-white">
                  Record History
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Chronological lifecycle of changes made to this medical record.
                </p>
              </div>
              <span className="text-xs text-white/40">
                {recordHistory.length} events logged
              </span>
            </div>

            {/* Vertical Timeline */}
            <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/10">
              {recordHistory.map((hist, index) => (
                <div key={hist.id} className="relative space-y-2">
                  {/* Timeline Dot */}
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 bg-[#0B0B0D] flex items-center justify-center ${
                      hist.stage === 'ORIGINAL_RECORD'
                        ? 'border-blue-500 text-blue-400'
                        : hist.stage === 'AUTHORIZED_CHANGE'
                        ? 'border-emerald-500 text-emerald-400'
                        : hist.stage === 'UNAUTHORIZED_MODIFICATION'
                        ? 'border-rose-500 text-rose-400'
                        : 'border-amber-500 text-amber-400'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        hist.stage === 'ORIGINAL_RECORD'
                          ? 'bg-blue-400'
                          : hist.stage === 'AUTHORIZED_CHANGE'
                          ? 'bg-emerald-400'
                          : hist.stage === 'UNAUTHORIZED_MODIFICATION'
                          ? 'bg-rose-400'
                          : 'bg-amber-400'
                      }`}
                    />
                  </div>

                  {/* Card Content */}
                  <div className="bg-[#101012] p-4 sm:p-5 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-white">
                          {hist.title}
                        </span>
                        <span className="text-xs font-semibold text-white/40 font-mono">
                          • {hist.doctorId}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-white/40 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-white/40" />
                        <span>{hist.timestamp}</span>
                      </span>
                    </div>

                    <p className="text-sm font-bold text-white">
                      {hist.whatChanged}
                    </p>

                    <p className="text-xs text-white/70">
                      Reason: {hist.reason}
                    </p>

                    <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-white/50">
                        Doctor: <span className="font-semibold text-white">{hist.doctor}</span>
                      </span>
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-semibold ${
                            hist.authorizationStatus.includes('✓')
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {hist.authorizationStatus}
                        </span>
                        <span
                          className={`font-semibold ${
                            hist.verificationStatus.includes('✓')
                              ? 'text-emerald-400'
                              : hist.verificationStatus.includes('Failed')
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {hist.verificationStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          SECTION 6 & 14: VIEW DETAILS MODAL
          ================================================== */}
      {showDetailModal && verificationResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm page-fade-in overflow-y-auto"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-[#0B0B0D] rounded-[28px] w-full max-w-2xl shadow-2xl border border-white/10 overflow-hidden my-8 space-y-6 p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
                  Medical Record Verification Details
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {verificationResult.recordTitle}
                </h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-white/40 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
                aria-label="Close details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Highlight */}
            <div>{renderStateBadge(verificationResult.state)}</div>

            {/* Doctor and Patient Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-2">
                <span className="text-white/40 uppercase font-bold block">
                  Patient Identity
                </span>
                <p className="font-bold text-white text-sm">
                  {verificationResult.patient.name}
                </p>
                <p className="text-white/50">
                  Health ID: <span className="font-mono font-bold text-cyan-400">{verificationResult.patient.healthId}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-2">
                <span className="text-white/40 uppercase font-bold block">
                  Modifying Clinician
                </span>
                <p className="font-bold text-white text-sm">
                  {verificationResult.changedBy.name}
                </p>
                {verificationResult.changedBy.doctorId && (
                  <p className="text-white/50">
                    Doctor ID: <span className="font-mono font-bold text-teal-300">{verificationResult.changedBy.doctorId}</span>
                  </p>
                )}
                {verificationResult.changedBy.hospital && (
                  <p className="text-white/50">{verificationResult.changedBy.hospital}</p>
                )}
              </div>
            </div>

            {/* Plain English Explanation */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1 text-xs">
              <span className="text-blue-300 font-bold uppercase tracking-wider block">
                Verification Summary & Notes
              </span>
              <p className="text-white/80 leading-relaxed font-medium">
                {verificationResult.detailedNotes}
              </p>
            </div>

            {/* Verification Breakdown */}
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              <div className="p-3 rounded-xl bg-[#101012] border border-white/5">
                <span className="text-white/40 block text-[10px] uppercase">Permission</span>
                <span className="font-semibold text-white mt-1 block">
                  {verificationResult.permission}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#101012] border border-white/5">
                <span className="text-white/40 block text-[10px] uppercase">Audit Trail</span>
                <span className="font-semibold text-white mt-1 block">
                  {verificationResult.audit}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#101012] border border-white/5">
                <span className="text-white/40 block text-[10px] uppercase">Integrity</span>
                <span className="font-semibold text-white mt-1 block">
                  {verificationResult.recordIntegrity}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all shadow-md cursor-pointer border border-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlockchainPage;
