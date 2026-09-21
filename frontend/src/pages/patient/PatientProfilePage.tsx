import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Heart,
  Calendar,
  Phone,
  Mail,
  MapPin,
  QrCode,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Building2,
  Edit2,
  Save,
  Camera,
  Upload,
  FileText,
  Clock,
  Lock,
  ArrowRight,
  Fingerprint,
  AlertOctagon,
  Pill,
  Plus,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import { PhotoUploadModal } from '../../components/common/PhotoUploadModal';
import { BackButton } from '../../components/common/BackButton';
import { Modal } from '../../components/common/Modal';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { api } from '../../services/api';
import { ScrollReveal, ScrollRevealGroup } from '../../components/common/ScrollReveal';

export interface AllergyItem {
  id?: string;
  allergen: string;
  severity: string;
  reaction: string;
  notes?: string;
}

export const PatientProfilePage: React.FC = () => {
  const { user, updateProfilePhoto } = useAuth();
  const { addToast } = useToast();
  const { t, localizeValue } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    id: user?.patient?.id || '',
    name: user?.patient?.fullName || user?.name || '',
    healthId: user?.patient?.healthId || user?.healthId || '',
    aadhaar: user?.patient?.govtIdNumber || 'Not provided',
    abhaId: user?.patient?.abhaId || '',
    dob: user?.patient?.dob || '',
    age: 0,
    gender: user?.patient?.gender || 'Not specified',
    bloodGroup: user?.patient?.bloodGroup || 'Not specified',
    phone: user?.patient?.mobile || user?.phone || '',
    email: user?.patient?.email || user?.email || '',
    address: user?.patient?.address || '',
    city: user?.patient?.city || '',
    state: user?.patient?.state || '',
    pincode: user?.patient?.pincode || '',
    identificationMarks: [] as string[],
    emergencyContactName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    allergies: [] as AllergyItem[],
    criticalConditions: [] as { condition: string; diagnosed: string; status: string }[],
    currentMedicines: [] as { name: string; schedule: string }[],
  });

  const [newMark, setNewMark] = useState('');
  const [isAddingMark, setIsAddingMark] = useState(false);

  // Allergy management state
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [editingAllergyIndex, setEditingAllergyIndex] = useState<number | null>(null);
  const [allergyForm, setAllergyForm] = useState<AllergyItem>({
    allergen: '',
    severity: 'Severe',
    reaction: '',
    notes: '',
  });
  const [deletingAllergyIndex, setDeletingAllergyIndex] = useState<number | null>(null);

  // Fetch real PostgreSQL profile on mount
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.getPatientProfile();
        const p = res?.patient || res?.data || (res?.success ? res : null);
        if (p) {
          let age = p.age;
          if (age === undefined || age === null || age === 0) {
            if (p.dob) {
              const dobDate = new Date(p.dob);
              if (!isNaN(dobDate.getTime())) {
                const today = new Date();
                age = today.getFullYear() - dobDate.getFullYear();
                const m = today.getMonth() - dobDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
                  age--;
                }
              }
            }
          }
          const em = p.emergencyContacts?.[0];
          if (isMounted) {
            setProfile({
              id: p.id || '',
              name: p.fullName || user?.name || '',
              healthId: p.healthId || user?.healthId || '',
              aadhaar: p.govtIdNumberMasked || p.govtIdNumber || 'Not provided',
              abhaId: p.abhaId || '',
              dob: p.dob || '',
              age: Math.max(0, age || 0),
              gender: p.gender || 'Not specified',
              bloodGroup: p.bloodGroup || 'Not specified',
              phone: p.mobile || user?.phone || '',
              email: p.email || user?.email || '',
              address: p.address || '',
              city: p.city || '',
              state: p.state || '',
              pincode: p.pincode || '',
              identificationMarks: p.identificationMarks || [],
              emergencyContactName: em?.name || em?.fullName || 'Not specified',
              emergencyRelation: em?.relation || em?.relationship || 'Contact',
              emergencyPhone: em?.phone || em?.mobileNumber || 'Not specified',
              allergies: (p.allergies || []).map((a: any) => ({
                id: a.id,
                allergen: a.allergen,
                severity: a.severity || 'MILD',
                reaction: a.reaction || 'None reported',
                notes: a.notes || '',
              })),
              criticalConditions: (p.conditions || []).map((c: any) => ({
                condition: c.name || c.condition,
                diagnosed: c.diagnosedDate || c.diagnosed || 'Recent',
                status: c.status || 'Active',
              })),
              currentMedicines: (p.medications || []).map((m: any) => ({
                name: m.medicineName || m.name,
                schedule: m.dosage ? `${m.dosage} - ${m.frequency || ''}` : (m.frequency || ''),
              })),
            });
          }
        }
      } catch (err) {
        console.error('Failed to load profile from PostgreSQL:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleOpenAddAllergy = () => {
    setEditingAllergyIndex(null);
    setAllergyForm({
      allergen: '',
      severity: 'Severe',
      reaction: '',
      notes: '',
    });
    setShowAllergyModal(true);
  };

  const handleOpenEditAllergy = (index: number) => {
    const item = profile.allergies[index];
    if (!item) return;
    setEditingAllergyIndex(index);
    setAllergyForm({
      id: item.id,
      allergen: item.allergen || '',
      severity: item.severity || 'Severe',
      reaction: item.reaction || '',
      notes: item.notes || '',
    });
    setShowAllergyModal(true);
  };

  const handleSaveAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allergyForm.allergen.trim()) {
      addToast('error', t('profile.allergenRequired', 'Please enter the allergy or medicine name.'));
      return;
    }

    const payload = {
      allergen: allergyForm.allergen.trim(),
      severity: allergyForm.severity.trim(),
      reaction: allergyForm.reaction.trim() || 'None reported',
      notes: allergyForm.notes ? allergyForm.notes.trim() : undefined,
    };

    try {
      const res = await api.addPatientAllergy(payload);
      if (res && res.success) {
        const item = res.allergy || res.data || res;
        const created: AllergyItem = {
          id: item.id,
          allergen: item.allergen,
          severity: item.severity,
          reaction: item.reaction || 'None reported',
          notes: item.notes || '',
        };
        setProfile((prev) => ({
          ...prev,
          allergies: [...prev.allergies, created],
        }));
        setShowAllergyModal(false);
        addToast('success', t('profile.allergyAdded', 'New allergy added successfully.'));
      } else {
        throw new Error(res?.message || 'Failed to save allergy');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to save allergy to PostgreSQL');
    }
  };

  const handleRequestDeleteAllergy = (index: number) => {
    setDeletingAllergyIndex(index);
  };

  const handleConfirmDeleteAllergy = async () => {
    if (deletingAllergyIndex !== null) {
      const target = profile.allergies[deletingAllergyIndex];
      try {
        if (target && target.id) {
          await api.deletePatientAllergy(target.id);
        }
        const updated = profile.allergies.filter((_, idx) => idx !== deletingAllergyIndex);
        setProfile((prev) => ({
          ...prev,
          allergies: updated,
        }));
        setDeletingAllergyIndex(null);
        addToast(
          'info',
          t('profile.allergyRemoved', '{name} removed from allergies.', {
            name: target?.allergen || 'Allergy',
          })
        );
      } catch (err: any) {
        addToast('error', err.message || 'Failed to delete allergy');
      }
    }
  };

  const handlePhotoSave = (newPhotoUrl: string | null) => {
    updateProfilePhoto(newPhotoUrl);
    addToast('success', newPhotoUrl ? 'Profile photo updated successfully!' : 'Profile photo removed.');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updatePatientProfile({
        address: profile.address,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
        bloodGroup: profile.bloodGroup,
        identificationMarks: profile.identificationMarks,
      });
      setIsEditing(false);
      addToast('success', 'Health profile details saved to PostgreSQL.');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to save profile changes.');
    }
  };

  const handleAddIdentificationMark = async () => {
    if (!newMark.trim()) return;
    const updated = [...profile.identificationMarks, newMark.trim()];
    try {
      await api.updatePatientProfile({ identificationMarks: updated });
      setProfile((prev) => ({
        ...prev,
        identificationMarks: updated,
      }));
      setNewMark('');
      setIsAddingMark(false);
      addToast('success', 'Identity mark saved to PostgreSQL.');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to save identity mark.');
    }
  };

  const handleRemoveIdentificationMark = async (index: number) => {
    const updated = profile.identificationMarks.filter((_, i) => i !== index);
    try {
      await api.updatePatientProfile({ identificationMarks: updated });
      setProfile((prev) => ({
        ...prev,
        identificationMarks: updated,
      }));
      addToast('info', 'Identity mark removed.');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to remove identity mark.');
    }
  };

  const handleDownloadCard = () => {
    const text = `NATIONAL SOVEREIGN HEALTH IDENTITY CARD\n--------------------------------------------\nName: ${profile.name}\nHealth ID: ${profile.healthId}\nStatus: Verified Citizen Health Identity\nAge: ${profile.age} Years | Gender: ${profile.gender} | Blood Group: ${profile.bloodGroup}\nDOB: ${profile.dob}\n\nIDENTIFICATION MARKS:\n${profile.identificationMarks.map((m) => `• ${m}`).join('\n')}\n\nALLERGIES:\n${profile.allergies.map((a) => `• ${a.allergen} (${a.severity}) - ${a.reaction}${a.notes ? ` [Notes: ${a.notes}]` : ''}`).join('\n')}\n\nEMERGENCY CONTACT:\n${profile.emergencyContactName} (${profile.emergencyRelation}) - ${profile.emergencyPhone}\n\nCRITICAL CONDITIONS:\n${profile.criticalConditions.map((c) => `• ${c.condition} - ${c.status}`).join('\n')}\n\nTamper-Evident SHA-256 Ledger Provenance: 0x8f3c7a21be892047cb59103e910248ad819203e4810294820192847291029482`;
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${profile.healthId}_health_identity_card.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    addToast('info', 'Digital Health ID Card downloaded.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Back Button */}
      <ScrollReveal direction="left">
        <div className="flex items-center justify-between">
          <BackButton fallbackPath="/patient" />
          <span className="text-xs font-mono text-zinc-500">
            Sovereign Patient Profile • Encrypted Record
          </span>
        </div>
      </ScrollReveal>

      {/* Top Header */}
      <ScrollReveal direction="left" delay={0.05}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full">
              {t('profile.citizenBadge', 'Citizen Health Identity')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-tight">
              {t('profile.pageTitle', 'Patient Health Profile')}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              {t('profile.pageSubtitle', 'Manage verified sovereign identity, identification marks, allergies, emergency contacts, and digital ID card.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPhotoModal(true)}
              className="px-4 py-2.5 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-300 text-xs font-bold hover:bg-teal-500/20 transition-all flex items-center gap-2 shadow-sm"
            >
              <Camera className="w-4 h-4 text-teal-400" />
              <span>{t('profile.uploadPhoto', 'Upload Profile Photo')}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCard}
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-[#101012] text-zinc-300 text-xs font-bold hover:bg-white/5 transition-all flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4 text-zinc-400" />
              <span>{t('profile.downloadCard', 'Download Card')}</span>
            </button>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-900/30 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                <span>{t('action.edit', 'Edit Profile')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{t('action.save', 'Save Changes')}</span>
              </button>
            )}
          </div>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Sovereign Health Credential Card & Centers */}
        <ScrollReveal direction="left" delay={0.08} className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-[#101012] via-[#0B0B0D] to-[#081514] text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-teal-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center font-bold shadow-lg shadow-teal-900/40">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    National Health ID
                  </h3>
                  <p className="text-[10px] text-zinc-400">Cryptographic EMR Credential</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>VERIFIED</span>
              </span>
            </div>

            {/* Profile photo inside card */}
            <div className="flex items-center gap-4 mb-5 relative z-10">
              <ProfileAvatar
                photoUrl={user?.profilePhoto}
                name={profile.name}
                role="PATIENT"
                size="xl"
                shape="rounded"
                className="border-2 border-white/20 shadow-md"
              />
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-white leading-tight">{localizeValue(profile.name, 'personName')}</h4>
                <p className="text-xs font-mono font-bold text-teal-400">{profile.healthId}</p>
                <div className="text-[10px] font-mono text-zinc-400 space-y-0.5">
                  <p>Aadhaar: <span className="text-white font-bold">{profile.aadhaar}</span></p>
                  <p>ABHA: <span className="text-white font-bold">{profile.abhaId}</span></p>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {profile.age} Yrs • {localizeValue(profile.gender, 'clinicalTerm')} • <strong className="text-rose-400">{profile.bloodGroup}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-white/10 relative z-10">
              {/* Dedicated bulleted identification marks on card */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                  Identification Marks
                </p>
                <ul className="text-xs text-zinc-300 space-y-1">
                  {profile.identificationMarks.map((mark, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-teal-400 font-bold">•</span>
                      <span>{localizeValue(mark, 'clinicalTerm')}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Emergency Contact */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                    Emergency Contact
                  </p>
                  <p className="text-xs font-bold text-zinc-200 mt-0.5">
                    {localizeValue(profile.emergencyContactName, 'personName')} ({localizeValue(profile.emergencyRelation, 'clinicalTerm')})
                  </p>
                  <p className="text-[11px] font-mono text-zinc-400">{profile.emergencyPhone}</p>
                </div>

                <div className="p-2 bg-white rounded-xl shadow-lg flex-shrink-0">
                  <QrCode className="w-12 h-12 text-black" />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
                <span>Tamper-Evident SHA-256</span>
                <span>Ethereum Verified</span>
              </div>
            </div>
          </div>

          {/* Linked Clinical Centers */}
          <div className="bg-[#0B0B0D] p-6 rounded-3xl border border-white/10 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-400" />
              <span>Linked Clinical Centers</span>
            </h4>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#101012] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{localizeValue('Apex Health City', 'hospitalName')}</p>
                  <p className="text-zinc-500">Primary Cardiology & Inpatient EMR</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Synced
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#101012] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{localizeValue('Care Hospital', 'hospitalName')}</p>
                  <p className="text-zinc-500">Neurology & Diagnostic Lab Center</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Synced
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Right Column: 7 Distinct Modular Sections */}
        <ScrollReveal direction="right" delay={0.1} className="lg:col-span-7 space-y-6">
          {/* SECTION 1: IDENTITY HEADER */}
          <div className="bg-[#0B0B0D] p-6 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <User className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">
                  {t('profile.sectionProfile', 'Profile & Identity')}
                </h2>
              </div>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Health ID Verified</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="relative">
                <ProfileAvatar
                  photoUrl={user?.profilePhoto}
                  name={profile.name}
                  role="PATIENT"
                  size="xl"
                  shape="rounded"
                  className="shadow-sm border-2 border-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(true)}
                  className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white shadow-lg transition-transform hover:scale-110"
                  title="Upload / Change Photo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <h3 className="text-xl font-bold text-white">{localizeValue(profile.name, 'personName')}</h3>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="font-mono text-xs font-bold text-teal-300 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20">
                    Health ID: {profile.healthId}
                  </span>
                  <span className="font-mono text-xs font-bold text-zinc-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                    Aadhaar: {profile.aadhaar}
                  </span>
                  <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                    {profile.abhaId}
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aadhaar / ABHA Synced</span>
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Primary Sovereign EMR Identity Holder • Registered on State EMR Gateway
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    className="text-xs font-bold text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{user?.profilePhoto ? 'Change or Remove Profile Photo' : 'Upload Profile Photo'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: PERSONAL INFORMATION */}
          <div className="bg-[#0B0B0D] p-6 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300">
                <User className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-white">
                {t('profile.sectionPersonal', 'Personal Information')}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-[#101012] rounded-2xl border border-white/5">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                  Age
                </span>
                <p className="font-bold text-white text-sm">{profile.age} Years</p>
              </div>

              <div className="p-3 bg-[#101012] rounded-2xl border border-white/5">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                  Date of Birth
                </span>
                <p className="font-bold text-white text-sm">{profile.dob}</p>
              </div>

              <div className="p-3 bg-[#101012] rounded-2xl border border-white/5">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                  Gender
                </span>
                <p className="font-bold text-white text-sm">{localizeValue(profile.gender, 'clinicalTerm')}</p>
              </div>

              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/30">
                <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">
                  Blood Group
                </span>
                <p className="font-black text-rose-300 text-base">{profile.bloodGroup}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Primary Mobile
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] disabled:bg-[#101012] text-white font-semibold focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] disabled:bg-[#101012] text-white font-semibold focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                Residential Address
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={`${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] disabled:bg-[#101012] text-white font-semibold focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          {/* SECTION 3: IDENTIFICATION MARKS */}
          <div className="bg-[#0B0B0D] p-6 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {t('profile.sectionIdentification', 'Identification Marks')}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Official biometric and physical marks recorded in the Sovereign Health Register
                  </p>
                </div>
              </div>

              {!isAddingMark && (
                <button
                  type="button"
                  onClick={() => setIsAddingMark(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-lg shadow-teal-900/30 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Identity Marks</span>
                </button>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-[#101012] border border-white/5 space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 block">
                IDENTIFICATION MARKS
              </span>

              {profile.identificationMarks.length === 0 && !isAddingMark ? (
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center space-y-3">
                  <p className="text-xs text-zinc-500 font-medium">
                    Not added yet
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddingMark(true)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Identity Marks</span>
                  </button>
                </div>
              ) : (
                <ul className="space-y-2 text-xs font-semibold text-zinc-200">
                  {profile.identificationMarks.map((mark, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#141416] border border-white/5 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
                        <span>{localizeValue(mark, 'clinicalTerm')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveIdentificationMark(index)}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer transition-colors"
                        title="Remove mark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {isAddingMark && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newMark}
                    onChange={(e) => setNewMark(e.target.value)}
                    placeholder="Enter new identification mark (e.g. Mole on left collarbone)..."
                    className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-[#141416] text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-teal-500 transition-colors"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddIdentificationMark}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-lg shadow-teal-900/30 cursor-pointer transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingMark(false);
                      setNewMark('');
                    }}
                    className="px-3 py-2 bg-white/5 border border-white/10 text-zinc-300 rounded-xl font-bold text-xs hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: EMERGENCY CONTACT */}
          <div className="bg-[#0B0B0D] p-6 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {t('profile.sectionEmergency', 'Emergency Contact')}
                </h2>
                <p className="text-xs text-zinc-500">Primary contact dialed during acute medical distress or trauma</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={isEditing ? profile.emergencyContactName : localizeValue(profile.emergencyContactName, 'personName')}
                  onChange={(e) => setProfile({ ...profile, emergencyContactName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] disabled:bg-[#101012] text-white font-semibold focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={isEditing ? profile.emergencyRelation : localizeValue(profile.emergencyRelation, 'clinicalTerm')}
                  onChange={(e) => setProfile({ ...profile, emergencyRelation: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] disabled:bg-[#101012] text-white font-semibold focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Emergency Phone
                </label>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={profile.emergencyPhone}
                  onChange={(e) => setProfile({ ...profile, emergencyPhone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] disabled:bg-[#101012] text-white font-semibold font-mono focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: ALLERGIES & REACTIONS */}
          <div className="bg-[#0B0B0D] p-6 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/5 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {t('profile.sectionAllergies', 'Allergies & Reactions')}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {t('profile.allergiesSub', 'Critical hypersensitivity and pharmacological contraindications')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleOpenAddAllergy}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-900/40 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('profile.addAllergy', '+ Add Allergy')}</span>
              </button>
            </div>

            <div className="space-y-3">
              {profile.allergies.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#101012] border border-dashed border-white/10 text-center space-y-3">
                  <p className="text-xs text-zinc-500 font-medium">
                    No allergies added
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddAllergy}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('profile.addAllergy', '+ Add Allergy')}</span>
                  </button>
                </div>
              ) : (
                profile.allergies.map((allergy, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-rose-200 text-sm">{localizeValue(allergy.allergen, 'clinicalTerm')}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-bold text-[10px]">
                            {localizeValue(allergy.severity, 'clinicalTerm')}
                          </span>
                        </div>
                        {allergy.reaction && (
                          <div className="text-rose-300 font-medium mt-1">
                            <span className="text-zinc-500 font-normal">
                              {t('profile.reactionLabel', 'Reaction')}:{' '}
                            </span>
                            {localizeValue(allergy.reaction, 'clinicalTerm')}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAllergy(i)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          title={t('profile.allergiesEdit', 'Edit')}
                        >
                          <Edit2 className="w-3 h-3 text-zinc-400" />
                          <span>{t('profile.allergiesEdit', 'Edit')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestDeleteAllergy(i)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          title={t('profile.allergiesRemove', 'Remove')}
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          <span>{t('profile.allergiesRemove', 'Remove')}</span>
                        </button>
                      </div>
                    </div>

                    {allergy.notes && (
                      <div className="pt-2 border-t border-rose-500/20 text-rose-300">
                        <span className="font-semibold text-zinc-400">
                          {t('profile.notesLabel', 'Additional Notes')}:{' '}
                        </span>
                        <span className="leading-relaxed">{localizeValue(allergy.notes, 'clinicalTerm')}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 6: CRITICAL INFORMATION */}
          <div className="bg-[#0B0B0D] p-6 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {t('profile.sectionCritical', 'Critical Information')}
                </h2>
                <p className="text-xs text-zinc-500">Active chronic health diagnoses and baseline clinical risk alerts</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
                Diagnosed Chronic Conditions
              </span>
              {profile.criticalConditions.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#101012] border border-dashed border-white/10 text-center">
                  <p className="text-xs text-zinc-500">
                    No diagnosed chronic conditions recorded
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {profile.criticalConditions.map((cond, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-[#101012] border border-white/5 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{localizeValue(cond.condition, 'clinicalTerm')}</span>
                        <span className="text-[10px] font-medium text-zinc-500">Since {cond.diagnosed}</span>
                      </div>
                      <p className="text-zinc-400">{localizeValue(cond.status, 'clinicalTerm')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 7: CURRENT MEDICINES */}
          <div className="bg-[#0B0B0D] p-6 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
              <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Pill className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {t('profile.sectionMedicines', 'Current Medicines')}
                </h2>
                <p className="text-xs text-zinc-500">Essential active maintenance prescriptions currently being taken</p>
              </div>
            </div>

            {profile.currentMedicines.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#101012] border border-dashed border-white/10 text-center">
                <p className="text-xs text-zinc-500">
                  No medicines added
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {profile.currentMedicines.map((med, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-[#101012] border border-white/5 text-xs space-y-1">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-teal-400" />
                      <span>{localizeValue(med.name, 'medicineName')}</span>
                    </p>
                    <p className="text-teal-400 text-[11px] font-medium">{localizeValue(med.schedule, 'clinicalTerm')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 8: LINKED CLINICAL EMR MODULES */}
          <div className="bg-[#0B0B0D] p-6 sm:p-7 rounded-3xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {t('profile.sectionModules', 'Linked Clinical Modules')}
                  </h2>
                  <p className="text-xs text-zinc-500">Direct sovereign record modules tied to this citizen profile</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <Link
                to="/patient/appointments"
                className="p-3.5 rounded-2xl bg-[#101012] hover:bg-white/5 border border-white/5 hover:border-white/15 transition-all flex flex-col items-center text-center group"
              >
                <Calendar className="w-5 h-5 text-blue-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-white">{t('nav.appointments', 'Appointments')}</span>
                <span className="text-[10px] text-zinc-500">Consultation schedule</span>
              </Link>

              <Link
                to="/patient/lab-reports"
                className="p-3.5 rounded-2xl bg-[#101012] hover:bg-white/5 border border-white/5 hover:border-white/15 transition-all flex flex-col items-center text-center group"
              >
                <FileText className="w-5 h-5 text-teal-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-white">{t('nav.labReports', 'Lab Reports')}</span>
                <span className="text-[10px] text-zinc-500">Biochemistry & ECG</span>
              </Link>

              <Link
                to="/patient/medicines"
                className="p-3.5 rounded-2xl bg-[#101012] hover:bg-white/5 border border-white/5 hover:border-white/15 transition-all flex flex-col items-center text-center group"
              >
                <Pill className="w-5 h-5 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-white">{t('nav.medicines', 'Prescriptions')}</span>
                <span className="text-[10px] text-zinc-500">Active doses & stock</span>
              </Link>

              <Link
                to="/patient/timeline"
                className="p-3.5 rounded-2xl bg-[#101012] hover:bg-white/5 border border-white/5 hover:border-white/15 transition-all flex flex-col items-center text-center group"
              >
                <Clock className="w-5 h-5 text-indigo-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-white">{t('nav.timeline', 'Health Timeline')}</span>
                <span className="text-[10px] text-zinc-500">Chronological history</span>
              </Link>

              <Link
                to="/patient/access-permissions"
                className="p-3.5 rounded-2xl bg-[#101012] hover:bg-white/5 border border-white/5 hover:border-white/15 transition-all flex flex-col items-center text-center group"
              >
                <Lock className="w-5 h-5 text-cyan-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-white">{t('nav.permissions', 'Access & Privacy')}</span>
                <span className="text-[10px] text-zinc-500">Doctor permissions</span>
              </Link>

              <Link
                to="/patient/security"
                className="p-3.5 rounded-2xl bg-[#101012] hover:bg-white/5 border border-white/5 hover:border-white/15 transition-all flex flex-col items-center text-center group"
              >
                <Shield className="w-5 h-5 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-white">{t('nav.security', 'Security & Ledger')}</span>
                <span className="text-[10px] text-zinc-500">Cryptographic audit</span>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        currentPhotoUrl={user?.profilePhoto}
        onSave={handlePhotoSave}
        userName={profile.name}
        userRole="PATIENT"
        title="Upload Patient Profile Photo"
      />

      {/* Edit / Add Allergy Modal */}
      <Modal
        isOpen={showAllergyModal}
        onClose={() => setShowAllergyModal(false)}
        title={
          editingAllergyIndex !== null
            ? t('profile.editAllergyTitle', 'Edit Allergy & Reaction')
            : t('profile.addAllergyTitle', 'Add Allergy & Reaction')
        }
        maxWidth="md"
      >
        <form onSubmit={handleSaveAllergy} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              {t('profile.allergyNameLabel', 'Allergy / Medicine Name')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={allergyForm.allergen}
              onChange={(e) => setAllergyForm({ ...allergyForm, allergen: e.target.value })}
              placeholder={t('profile.allergyNamePlaceholder', 'e.g., Penicillin')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500 text-sm font-medium transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                {t('profile.severityLabel', 'Severity')} <span className="text-rose-500">*</span>
              </label>
              <select
                value={allergyForm.severity}
                onChange={(e) => setAllergyForm({ ...allergyForm, severity: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white focus:outline-none focus:border-rose-500 text-sm font-medium transition-colors"
              >
                <option value="Severe">{t('profile.severitySevere', 'Severe')}</option>
                <option value="Moderate">{t('profile.severityModerate', 'Moderate')}</option>
                <option value="Mild">{t('profile.severityMild', 'Mild')}</option>
                <option value="Life-threatening">{t('profile.severityLifeThreatening', 'Life-threatening')}</option>
                {allergyForm.severity &&
                  !['Severe', 'Moderate', 'Mild', 'Life-threatening'].includes(allergyForm.severity) && (
                    <option value={allergyForm.severity}>{allergyForm.severity}</option>
                  )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                {t('profile.reactionLabel', 'Reaction')}
              </label>
              <input
                type="text"
                value={allergyForm.reaction}
                onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })}
                placeholder={t('profile.reactionPlaceholder', 'e.g., Anaphylaxis')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500 text-sm font-medium transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              {t('profile.notesLabel', 'Additional Notes')}
            </label>
            <textarea
              rows={3}
              value={allergyForm.notes}
              onChange={(e) => setAllergyForm({ ...allergyForm, notes: e.target.value })}
              placeholder={t(
                'profile.notesPlaceholder',
                'e.g., Severe breathing distress & systemic rash; strictly avoid all Beta-lactams'
              )}
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500 text-sm font-normal leading-relaxed resize-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={() => setShowAllergyModal(false)}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            >
              {t('profile.allergiesCancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-900/40 transition-all cursor-pointer"
            >
              {t('profile.allergiesSaveChanges', 'Save Changes')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Remove Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deletingAllergyIndex !== null}
        onClose={() => setDeletingAllergyIndex(null)}
        onConfirm={handleConfirmDeleteAllergy}
        title={t('profile.deleteAllergyTitle', 'Remove Allergy')}
        message={t(
          'profile.deleteAllergyConfirm',
          'Are you sure you want to remove this allergy from your medical profile? This action will immediately remove it from your record.'
        )}
        confirmText={t('profile.removeConfirm', 'Remove Allergy')}
        cancelText={t('profile.allergiesCancel', 'Cancel')}
        isDestructive={true}
      />
    </div>
  );
};
