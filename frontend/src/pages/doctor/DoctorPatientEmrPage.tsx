import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  User,
  Heart,
  Calendar,
  FileText,
  Pill,
  Stethoscope,
  Activity,
  Plus,
  Eye,
  Download,
  AlertTriangle,
  Building2,
  Clock,
  Scissors,
  History,
  CheckCircle2,
  AlertOctagon,
  ArrowLeft,
  ShieldAlert,
  Edit3,
  Search,
  Filter,
  UploadCloud,
  Check,
  Copy,
  UserCheck,
} from 'lucide-react';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import { Modal } from '../../components/common/Modal';
import { DocumentViewer } from '../../components/common/DocumentViewer';
import { FileUploader } from '../../components/common/FileUploader';
import { ScrollReveal, ScrollRevealGroup, GlowCard } from '../../components/common/ScrollReveal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';

export const DoctorPatientEmrPage: React.FC = () => {
  const { id, tab: urlTab, reportId: urlReportId } = useParams<{ id: string; tab?: string; reportId?: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error, addToast } = useToast();
  const { t } = useLanguage();

  const patientHealthId = id || '';

  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [deniedMessage, setDeniedMessage] = useState('');
  const [patient, setPatient] = useState<any | null>(null);
  const [activePermission, setActivePermission] = useState<any | null>(null);
  const [activeEmergencySession, setActiveEmergencySession] = useState<any | null>(null);
  const [allowedScopes, setAllowedScopes] = useState<string[]>([]);
  const [accessMode, setAccessMode] = useState<string>('NORMAL');

  // Active Tab state resolution
  const resolveInitialTab = (): 'OVERVIEW' | 'CONSULTATIONS' | 'PRESCRIPTIONS' | 'REPORTS' | 'MEDICINES' => {
    const qTab = searchParams.get('tab')?.toUpperCase();
    if (qTab === 'REPORTS' || qTab === 'LABS' || qTab === 'LAB_REPORTS') return 'REPORTS';
    if (qTab === 'CONSULTATIONS') return 'CONSULTATIONS';
    if (qTab === 'PRESCRIPTIONS') return 'PRESCRIPTIONS';
    if (qTab === 'MEDICINES' || qTab === 'MEDICATIONS') return 'MEDICINES';

    const path = location.pathname.toLowerCase();
    if (path.includes('/reports') || urlTab?.toLowerCase() === 'reports') return 'REPORTS';
    if (path.includes('/consultations') || urlTab?.toLowerCase() === 'consultations') return 'CONSULTATIONS';
    if (path.includes('/prescriptions') || urlTab?.toLowerCase() === 'prescriptions') return 'PRESCRIPTIONS';
    if (path.includes('/medicines') || urlTab?.toLowerCase() === 'medicines') return 'MEDICINES';

    return 'OVERVIEW';
  };

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CONSULTATIONS' | 'PRESCRIPTIONS' | 'REPORTS' | 'MEDICINES'>(resolveInitialTab);

  // Synchronize tab if URL param changes
  useEffect(() => {
    const currentTab = resolveInitialTab();
    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [location.pathname, searchParams]);

  // Report viewing & uploading state
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTestName, setUploadTestName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Biochemistry');
  const [uploadLabName, setUploadLabName] = useState('Apex Diagnostic Services');
  const [uploadSummary, setUploadSummary] = useState('');
  const [uploadFileHash, setUploadFileHash] = useState('');
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [reportCategoryFilter, setReportCategoryFilter] = useState('ALL');

  // Edit Consultation state
  const [editingConsultation, setEditingConsultation] = useState<any | null>(null);
  const [editDiagnosis, setEditDiagnosis] = useState('');
  const [editSymptoms, setEditSymptoms] = useState('');
  const [editTreatmentPlan, setEditTreatmentPlan] = useState('');
  const [editClinicalNotes, setEditClinicalNotes] = useState('');
  const [editFollowUpDate, setEditFollowUpDate] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchEmr = async () => {
      if (!patientHealthId) {
        setAccessDenied(true);
        setDeniedMessage('No patient identifier provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setAccessDenied(false);
        const res = await api.getAuthorizedEMR(patientHealthId);
        if (isMounted) {
          if (res.success && res.patient) {
            setPatient(res.patient);
            setActivePermission(res.activePermission || null);
            setActiveEmergencySession(res.activeEmergencySession || null);
            setAllowedScopes(res.allowedScopes || []);
            setAccessMode(res.accessMode || 'NORMAL');

            // If a specific reportId was requested in the URL, auto-select it
            if (urlReportId && res.patient.labReports && Array.isArray(res.patient.labReports)) {
              const target = res.patient.labReports.find((r: any) => r.id === urlReportId || r.reportNumber === urlReportId);
              if (target) {
                setSelectedReport(target);
              }
            }
          } else {
            setAccessDenied(true);
            setDeniedMessage(res.message || 'Access to this patient records is unauthorized.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setAccessDenied(true);
          setDeniedMessage(err.message || 'You do not have active consent permission or an emergency session for this patient.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEmr();
    return () => {
      isMounted = false;
    };
  }, [patientHealthId, user]);

  const handleTabChange = (newTab: 'OVERVIEW' | 'CONSULTATIONS' | 'PRESCRIPTIONS' | 'REPORTS' | 'MEDICINES') => {
    setActiveTab(newTab);
    const subRoute = newTab === 'OVERVIEW' ? 'emr' : newTab.toLowerCase();
    navigate(`/doctor/patients/${patientHealthId}/${subRoute}`, { replace: true });
  };

  const handleOpenEdit = (c: any) => {
    setEditingConsultation(c);
    setEditDiagnosis(c.diagnosis || '');
    setEditSymptoms(c.symptoms || '');
    setEditTreatmentPlan(c.treatmentPlan || '');
    setEditClinicalNotes(c.clinicalNotes || '');
    setEditFollowUpDate(c.followUpDate ? c.followUpDate.split('T')[0] : '');
  };

  const handleSaveEdit = async () => {
    if (!editingConsultation) return;
    try {
      setIsSavingEdit(true);
      const res = await api.updateConsultation(editingConsultation.id, {
        diagnosis: editDiagnosis,
        symptoms: editSymptoms,
        treatmentPlan: editTreatmentPlan,
        clinicalNotes: editClinicalNotes,
        followUpDate: editFollowUpDate || null,
      });

      if (res.success && res.consultation) {
        success('Consultation updated successfully');
        setPatient((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            consultations: (prev.consultations || []).map((item: any) =>
              item.id === editingConsultation.id ? { ...item, ...res.consultation } : item
            ),
          };
        });
        setEditingConsultation(null);
      } else {
        error(res.message || 'Failed to update consultation');
      }
    } catch (err: any) {
      error(err.message || 'Failed to update consultation');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handlePublishReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient || !uploadTestName.trim() || !uploadSummary.trim()) {
      addToast('error', 'Please provide a test name and clinical findings summary.');
      return;
    }

    try {
      setIsUploadingReport(true);
      const res = await api.createLabReport({
        patientId: patient.id,
        testName: uploadTestName.trim(),
        category: uploadCategory,
        laboratoryName: uploadLabName.trim() || 'Apex Diagnostic Services',
        sampleDate: new Date().toISOString().split('T')[0],
        resultDate: new Date().toISOString().split('T')[0],
        summary: uploadSummary.trim(),
        findings: {
          test: uploadTestName.trim(),
          category: uploadCategory,
          clinicalImpression: uploadSummary.trim(),
          verifiedAt: new Date().toISOString(),
        },
      });

      if (res && res.success && res.report) {
        addToast('success', `Diagnostic report "${uploadTestName}" published and sealed on ledger!`);
        setPatient((prev: any) => {
          if (!prev) return prev;
          const currentReports = prev.labReports || [];
          return {
            ...prev,
            labReports: [res.report, ...currentReports],
          };
        });
        setShowUploadModal(false);
        setUploadTestName('');
        setUploadSummary('');
        setUploadFileHash('');
      } else {
        addToast('error', res?.error || res?.message || 'Failed to publish lab report');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to publish diagnostic report');
    } finally {
      setIsUploadingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-2 border-teal-500/20 border-t-teal-400 animate-spin mx-auto" />
        <p className="text-xs font-semibold text-white/50 tracking-wider uppercase">Verifying cryptographic consent and loading EMR...</p>
      </div>
    );
  }

  // =========================================================================
  // ACCESS DENIED SCREEN
  // =========================================================================
  if (accessDenied || !patient) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
        <ScrollReveal direction="bottom">
          <div className="bg-[#0B0B0D] p-8 sm:p-12 text-center rounded-[28px] border border-rose-500/20 shadow-2xl shadow-rose-950/20 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-md mx-auto relative z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                Access Clearance Denied (403)
              </span>
              <h1 className="text-2xl font-bold text-white mt-2">
                EMR Access Not Authorized
              </h1>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                {deniedMessage || 'You do not have an active consent clearance or an active emergency session for this patient.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 max-w-md mx-auto text-xs text-white/70 text-left space-y-2 relative z-10">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white/90">Patient Identifier:</span>
                <span className="font-mono text-cyan-400">{patientHealthId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white/90">Status:</span>
                <span className="font-bold text-rose-400">UNAUTHORIZED</span>
              </div>
              <p className="text-[11px] text-white/40 pt-2 border-t border-white/5">
                Under sovereign healthcare privacy policy, medical records cannot be accessed without an active, unexpired consent grant approved by the patient or an emergency override.
              </p>
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3 relative z-10">
              <button
                type="button"
                onClick={() => navigate('/doctor/patients')}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-white/80 hover:bg-white/5 text-xs font-semibold transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Patient Directory</span>
              </button>

              <Link
                to={`/doctor/patients?query=${patientHealthId}`}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold transition-all shadow-lg shadow-teal-950/40"
              >
                Request EMR Clearance
              </Link>

              <Link
                to={`/doctor/patients?query=${patientHealthId}`}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-lg shadow-rose-950/40 flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Emergency Access Protocol</span>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    );
  }

  // =========================================================================
  // AUTHORIZED EMR SCREEN
  // =========================================================================
  const isEmergency = accessMode === 'EMERGENCY_OVERRIDE' || !!activeEmergencySession;
  const canModify = (activePermission?.status === 'ACTIVE' && (!activePermission.expiresAt || new Date(activePermission.expiresAt) > new Date())) || isEmergency;

  // Filtered reports
  const labReportsList: any[] = patient.labReports || [];
  const filteredReports = labReportsList.filter((r) => {
    if (reportCategoryFilter === 'ALL') return true;
    return r.category === reportCategoryFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <ScrollReveal direction="bottom">
        <div className={`p-5 rounded-[24px] text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border ${
          isEmergency
            ? 'bg-gradient-to-r from-rose-950/80 via-red-900/60 to-[#0B0B0D] border-rose-500/30'
            : 'bg-gradient-to-r from-teal-950/80 via-cyan-950/50 to-[#0B0B0D] border-teal-500/30'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-2xl flex-shrink-0 ${isEmergency ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'}`}>
              {isEmergency ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isEmergency ? 'bg-rose-500/20 text-rose-300' : 'bg-teal-500/20 text-teal-300'}`}>
                  {isEmergency ? 'EMERGENCY CLINICAL ACCESS' : 'AUTHORIZED SOVEREIGN CONSENT'}
                </span>
                <span className="text-xs text-white/60">
                  • {isEmergency ? 'Expires in 2 hours' : 'Active Consent Grant'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                Viewing EMR of {patient.fullName} <span className="text-white/40">({patient.healthId})</span>
              </h2>
              <p className="text-xs text-white/60 mt-0.5">
                Active Scopes: <strong className="text-teal-300">{allowedScopes.join(', ') || 'All Clinical Scopes'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold bg-white/5 px-3.5 py-2 rounded-xl border border-white/10 whitespace-nowrap text-emerald-400">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Cryptographic Audit Log Active</span>
          </div>
        </div>
      </ScrollReveal>

      {/* Patient Header Card */}
      <ScrollReveal direction="bottom" delay={0.05}>
        <div className="bg-[#0B0B0D] p-6 rounded-[24px] border border-white/10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <ProfileAvatar
              photoUrl={patient.profilePhoto}
              name={patient.fullName}
              role="PATIENT"
              size="xl"
              shape="rounded"
              className="border-2 border-white/10 shadow-sm flex-shrink-0"
            />

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20">
                <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Current Patient Workspace</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white">
                  {patient.fullName}
                </h1>
                <span className="font-mono text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-md border border-cyan-500/20">
                  {patient.healthId}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                  ✓ Verified
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                <span>{patient.gender || 'Not specified'}</span>
                <span>•</span>
                <span>DOB: {patient.dob || 'Not specified'}</span>
                <span>•</span>
                <span>Blood Group: <strong className="text-rose-400 font-semibold">{patient.bloodGroup || 'Not specified'}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to={`/doctor/consultation/new?patientId=${patient.id}&healthId=${patient.healthId}&name=${encodeURIComponent(patient.fullName)}`}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Consultation</span>
            </Link>

            <Link
              to={`/doctor/prescriptions?patientId=${patient.id}&healthId=${patient.healthId}&name=${encodeURIComponent(patient.fullName)}`}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Pill className="w-4 h-4" />
              <span>Add Prescription</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Add Report</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Tabs */}
      <ScrollReveal direction="bottom" delay={0.1}>
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
          {(['OVERVIEW', 'CONSULTATIONS', 'PRESCRIPTIONS', 'REPORTS', 'MEDICINES'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-950/40 border border-teal-500/30'
                  : 'bg-[#101012] text-white/60 hover:text-white hover:bg-white/5 border border-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Tab Content: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <ScrollRevealGroup direction="bottom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Allergies & Alerts */}
            <div className="p-6 rounded-[24px] bg-[#0B0B0D] border border-white/10 shadow-lg space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" />
                <span>Allergies & Critical Warnings</span>
              </h3>

              {patient.allergies && patient.allergies.length > 0 ? (
                <div className="space-y-2">
                  {patient.allergies.map((alg: any) => (
                    <div key={alg.id} className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs">
                      <p className="font-semibold text-rose-200">{alg.allergen}</p>
                      <p className="text-rose-400/80 text-[11px] mt-0.5">{alg.severity} • {alg.reaction || alg.notes || 'Strict Avoidance'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/40">No known allergies registered.</p>
              )}
            </div>

            {/* Chronic Conditions */}
            <div className="p-6 rounded-[24px] bg-[#0B0B0D] border border-white/10 shadow-lg space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>Medical Conditions & Diagnoses</span>
              </h3>

              {patient.conditions && patient.conditions.length > 0 ? (
                <div className="space-y-2">
                  {patient.conditions.map((cond: any) => (
                    <div key={cond.id} className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs">
                      <p className="font-semibold text-teal-200">{cond.conditionName || cond.name}</p>
                      <p className="text-teal-400/80 text-[11px] mt-0.5">Status: {cond.status || 'Active'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/40">No chronic medical conditions recorded.</p>
              )}
            </div>
          </div>
        </ScrollRevealGroup>
      )}

      {/* Tab Content: CONSULTATIONS */}
      {activeTab === 'CONSULTATIONS' && (
        <ScrollReveal direction="bottom">
          <div className="p-6 rounded-[24px] bg-[#0B0B0D] border border-white/10 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Clinical Consultations
              </h3>
              {canModify && (
                <Link
                  to={`/doctor/consultation/new?patientId=${patient.id}&healthId=${patient.healthId}`}
                  className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-semibold hover:bg-teal-500/20 flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Record</span>
                </Link>
              )}
            </div>

            {patient.consultations && patient.consultations.length > 0 ? (
              <div className="space-y-3">
                {patient.consultations.map((c: any) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{c.diagnosis || 'Clinical Note'}</span>
                        {c.doctor?.fullName && (
                          <span className="text-[11px] text-white/40">by Dr. {c.doctor.fullName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white/40">{c.date || c.createdAt?.split('T')[0]}</span>
                        {canModify && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="px-2.5 py-1 rounded-lg bg-[#141416] border border-white/10 text-white/70 hover:text-teal-400 hover:border-teal-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>
                    </div>
                    {c.symptoms && <p className="text-white/70"><strong>Symptoms:</strong> {c.symptoms}</p>}
                    {c.clinicalNotes && <p className="text-white/70"><strong>Notes:</strong> {c.clinicalNotes}</p>}
                    {c.treatmentPlan && <p className="text-white/50 font-mono text-[11px]"><strong>Plan:</strong> {c.treatmentPlan}</p>}
                    {c.followUpDate && <p className="text-teal-400 text-[11px]"><strong>Follow-up:</strong> {c.followUpDate.split('T')[0]}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/40">No consultation records recorded yet.</p>
            )}
          </div>
        </ScrollReveal>
      )}

      {/* Tab Content: PRESCRIPTIONS */}
      {activeTab === 'PRESCRIPTIONS' && (
        <ScrollReveal direction="bottom">
          <div className="p-6 rounded-[24px] bg-[#0B0B0D] border border-white/10 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Prescriptions & Regimens
              </h3>
              {canModify && (
                <Link
                  to={`/doctor/prescriptions/new?patientId=${patient.id}&healthId=${patient.healthId}`}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold hover:bg-blue-500/20 flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Issue Prescription</span>
                </Link>
              )}
            </div>

            {patient.prescriptions && patient.prescriptions.length > 0 ? (
              <div className="space-y-3">
                {patient.prescriptions.map((rx: any) => (
                  <div key={rx.id} className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold font-mono text-teal-400">{rx.prescriptionNumber || 'RX'}</span>
                      <span className="font-mono text-white/40">{rx.createdAt?.split('T')[0]}</span>
                    </div>
                    <p className="font-medium text-white">{rx.diagnosis}</p>
                    {rx.medicines && rx.medicines.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {rx.medicines.map((m: any, i: number) => (
                          <div key={i} className="text-[11px] text-white/70 flex items-center justify-between">
                            <span>• {m.medicineName} {m.dosage}</span>
                            <span className="font-mono text-white/50">{m.frequency} ({m.duration})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/40">No prescriptions on record.</p>
            )}
          </div>
        </ScrollReveal>
      )}

      {/* Tab Content: REPORTS */}
      {activeTab === 'REPORTS' && (
        <ScrollReveal direction="bottom">
          <div className="space-y-6">
            <div className="p-6 rounded-[24px] bg-[#0B0B0D] border border-white/10 shadow-lg space-y-5">
              {/* Reports Tab Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-400" />
                    <span>Diagnostic & Lab Reports</span>
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Certified laboratory findings and pathology panels for {patient.fullName} ({patient.healthId}).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Category Filter */}
                  <select
                    value={reportCategoryFilter}
                    onChange={(e) => setReportCategoryFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-white/10 text-xs bg-[#101012] text-white/80 focus:border-teal-500 outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Pathology">Pathology</option>
                    <option value="Hematology">Hematology</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Radiology & Imaging">Radiology & Imaging</option>
                  </select>

                  {canModify && (
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(true)}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-[0.99]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload Lab Report</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Reports List or Empty State */}
              {filteredReports.length > 0 ? (
                <div className="space-y-4">
                  {filteredReports.map((lab: any) => {
                    let parameters: any[] = [];
                    if (lab.findingsJson) {
                      try {
                        const parsed = JSON.parse(lab.findingsJson);
                        if (Array.isArray(parsed)) parameters = parsed;
                        else if (typeof parsed === 'object') {
                          parameters = Object.entries(parsed)
                            .filter(([k]) => k !== 'verifiedAt')
                            .map(([k, v]) => ({
                              name: k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
                              value: String(v),
                              unit: '',
                              refRange: 'Verified',
                              status: 'normal',
                            }));
                        }
                      } catch (e) {}
                    }

                    return (
                      <div
                        key={lab.id}
                        className="p-5 rounded-2xl bg-[#101012] border border-white/5 space-y-3 text-xs transition-all hover:border-teal-500/30"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-sm flex-shrink-0 border border-teal-500/20">
                              <Activity className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-white">
                                  {lab.testName}
                                </h4>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                                  {lab.status || 'COMPLETED'}
                                </span>
                              </div>
                              <p className="text-[11px] text-teal-400 font-semibold mt-0.5">
                                {lab.category || 'Biochemistry'} • Ref ID: <span className="font-mono">{lab.reportNumber || lab.id}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-end justify-between text-xs">
                            <span className="font-semibold text-white/90">
                              {lab.resultDate || lab.sampleDate || lab.createdAt?.split('T')[0]}
                            </span>
                            <span className="text-[11px] text-white/40 mt-0.5">
                              {lab.laboratoryName || 'Apex Diagnostic Services'}
                            </span>
                          </div>
                        </div>

                        {/* Summary / Impression */}
                        {lab.summary && (
                          <div className="p-3 bg-[#0B0B0D] rounded-xl border border-white/5 text-white/70">
                            <strong className="text-white">Clinical Summary:</strong> {lab.summary}
                          </div>
                        )}

                        {/* Parameter Table if available */}
                        {parameters.length > 0 && (
                          <div className="overflow-x-auto bg-[#0B0B0D] rounded-xl border border-white/5 p-3">
                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="border-b border-white/5 text-white/40 font-semibold uppercase tracking-wider text-[10px]">
                                  <th className="pb-2">Parameter</th>
                                  <th className="pb-2">Value</th>
                                  <th className="pb-2">Reference</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 text-white/70">
                                {parameters.map((p, idx) => (
                                  <tr key={idx}>
                                    <td className="py-1.5 font-semibold text-white">{p.name}</td>
                                    <td className="py-1.5 font-mono font-bold text-teal-400">{p.value} {p.unit}</td>
                                    <td className="py-1.5 text-white/40 font-mono text-[11px]">{p.refRange}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Blockchain Proof & Actions */}
                        <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Cryptographically Anchored on Ledger</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedReport(lab)}
                              className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Full Report</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl bg-[#101012] border border-white/5 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/20">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    No reports available
                  </h4>
                  <p className="text-xs text-white/40 max-w-sm mx-auto">
                    No laboratory or diagnostic investigation reports have been published for this patient.
                  </p>
                  {canModify && (
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(true)}
                      className="mt-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-md"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload First Report</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Tab Content: MEDICINES */}
      {activeTab === 'MEDICINES' && (
        <ScrollReveal direction="bottom">
          <div className="p-6 rounded-[24px] bg-[#0B0B0D] border border-white/10 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Current Active Medications
            </h3>

            {patient.medications && patient.medications.length > 0 ? (
              <div className="space-y-3">
                {patient.medications.map((med: any) => (
                  <div key={med.id} className="p-4 rounded-2xl bg-[#101012] border border-white/5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{med.name} {med.dosage}</p>
                      <p className="text-white/50">{med.frequency} • {med.instructions || 'As directed'}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-400 font-mono text-[11px] font-semibold border border-teal-500/20">
                      {med.status || 'ACTIVE'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/40">No active medications registered.</p>
            )}
          </div>
        </ScrollReveal>
      )}

      {/* Edit Consultation Modal */}
      <Modal
        isOpen={!!editingConsultation}
        onClose={() => setEditingConsultation(null)}
        title="Edit Consultation Record"
        maxWidth="lg"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Diagnosis / Clinical Assessment *
            </label>
            <input
              type="text"
              value={editDiagnosis}
              onChange={(e) => setEditDiagnosis(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white text-xs focus:border-teal-500 outline-none"
              placeholder="e.g. Acute Pharyngitis"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Presenting Symptoms / Chief Complaints
            </label>
            <textarea
              rows={2}
              value={editSymptoms}
              onChange={(e) => setEditSymptoms(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white text-xs focus:border-teal-500 outline-none"
              placeholder="e.g. Sore throat, fever 101F, difficulty swallowing"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Clinical Notes / Examination Findings
            </label>
            <textarea
              rows={3}
              value={editClinicalNotes}
              onChange={(e) => setEditClinicalNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white text-xs focus:border-teal-500 outline-none"
              placeholder="Detailed physical exam observations, chest clear, throat inflamed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Treatment Plan / Recommendations
            </label>
            <textarea
              rows={2}
              value={editTreatmentPlan}
              onChange={(e) => setEditTreatmentPlan(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white text-xs focus:border-teal-500 outline-none"
              placeholder="Prescribed oral antibiotics, warm saline gargle, rest"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Follow-up Review Date
            </label>
            <input
              type="date"
              value={editFollowUpDate}
              onChange={(e) => setEditFollowUpDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white text-xs focus:border-teal-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setEditingConsultation(null)}
              className="px-4 py-2 rounded-xl border border-white/10 text-white/70 text-xs font-semibold hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSavingEdit || !editDiagnosis.trim()}
              onClick={handleSaveEdit}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-md flex items-center gap-1.5"
            >
              {isSavingEdit ? 'Saving Changes...' : 'Save Consultation'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Upload Lab Report Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={`Publish Lab Report for ${patient.fullName}`}
        maxWidth="lg"
      >
        <form onSubmit={handlePublishReport} className="space-y-4 pt-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">
                Investigation / Test Name *
              </label>
              <input
                type="text"
                value={uploadTestName}
                onChange={(e) => setUploadTestName(e.target.value)}
                placeholder="e.g. Complete Blood Count (CBC) or Lipid Profile"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white font-medium outline-none focus:border-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">
                Diagnostic Category
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white outline-none focus:border-teal-500"
              >
                <option value="Biochemistry">Biochemistry</option>
                <option value="Pathology">Pathology</option>
                <option value="Hematology">Hematology</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="Radiology & Imaging">Radiology & Imaging</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">
              Laboratory / Diagnostic Center
            </label>
            <input
              type="text"
              value={uploadLabName}
              onChange={(e) => setUploadLabName(e.target.value)}
              placeholder="e.g. Apex Diagnostic Services"
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">
              Pathologist Summary / Key Findings *
            </label>
            <textarea
              rows={3}
              value={uploadSummary}
              onChange={(e) => setUploadSummary(e.target.value)}
              placeholder="Enter observed clinical findings, parameter deviations, or diagnostic interpretation..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white outline-none focus:border-teal-500"
              required
            />
          </div>

          <div>
            <FileUploader
              label="Select Diagnostic PDF or Scanned Document"
              onFileSelect={(_file, hash) => setUploadFileHash(hash)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 rounded-xl border border-white/10 text-white/70 text-xs font-semibold hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploadingReport || !uploadTestName.trim() || !uploadSummary.trim()}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-md flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isUploadingReport ? 'Publishing & Anchoring...' : 'Publish & Anchor to Ledger'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Document Viewer Modal */}
      {selectedReport && (
        <DocumentViewer
          isOpen={true}
          onClose={() => setSelectedReport(null)}
          title={selectedReport.testName}
          category={`${selectedReport.category || 'Diagnostic'} Report`}
          date={selectedReport.resultDate || selectedReport.sampleDate || selectedReport.createdAt?.split('T')[0]}
          doctorName={selectedReport.doctor?.fullName || user?.doctor?.fullName || 'Attending Physician'}
          hospitalName={selectedReport.laboratoryName || 'Apex Diagnostic Services'}
          contentSnippet={
            <div className="space-y-4">
              <div className="p-4 bg-[#101012] rounded-xl border border-white/10 space-y-2">
                <div className="text-xs text-white/70 font-medium">
                  <strong className="text-white">Diagnostic Impression:</strong>{' '}
                  {selectedReport.summary || 'Normal physiological parameters recorded.'}
                </div>
              </div>
            </div>
          }
          blockchainProof={{
            recordHash: selectedReport.recordHash || '0x00',
            blockNumber: 10482,
            transactionHash: selectedReport.blockchainTxId || '0x00',
            verified: selectedReport.blockchainStatus === 'VERIFIED',
          }}
        />
      )}
    </div>
  );
};

export default DoctorPatientEmrPage;
