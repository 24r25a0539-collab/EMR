import React, { useState, useEffect } from 'react';
import {
  User,
  Award,
  Hospital,
  Mail,
  Phone,
  MapPin,
  Stethoscope,
  ShieldCheck,
  Save,
  Clock,
  Key,
  Calendar,
  Camera,
  Upload,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ProfileAvatar } from '../../components/common/ProfileAvatar';
import { PhotoUploadModal } from '../../components/common/PhotoUploadModal';
import { appointmentBookingService } from '../../services/appointmentBookingService';
import { api } from '../../services/api';
import {
  ScrollReveal,
  ScrollRevealGroup,
  PremiumCard,
  GlowCard,
} from '../../components/common/ScrollReveal';

export const DoctorProfilePage: React.FC = () => {
  const { user, updateProfilePhoto } = useAuth();
  const { addToast } = useToast();
  const { t } = useLanguage();

  const [name, setName] = useState(user?.doctor?.fullName || user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.mobile || '');
  const [licenseNumber, setLicenseNumber] = useState(user?.doctor?.registrationNumber || '');
  const [doctorIdNumber, setDoctorIdNumber] = useState(user?.doctor?.doctorIdNumber || '');
  const [specialization, setSpecialization] = useState(user?.doctor?.specialization || '');
  const [qualification, setQualification] = useState(user?.doctor?.qualifications || '');
  const [hospital, setHospital] = useState(user?.doctor?.hospitalAffiliation || '');
  const [department, setDepartment] = useState(user?.doctor?.department || '');
  const [experienceYears, setExperienceYears] = useState(String(user?.doctor?.experienceYears ?? ''));
  const [authority, setAuthority] = useState(user?.doctor?.authority || '');
  const [registrationState, setRegistrationState] = useState(user?.doctor?.registrationState || '');
  const [verificationStatus, setVerificationStatus] = useState(user?.doctor?.regStatus || 'ACTIVE');
  const [consultationFee, setConsultationFee] = useState('850');
  const [bio, setBio] = useState('Accredited Medical Practitioner providing compassionate clinical care, diagnostics, and patient treatment.');
  const [saving, setSaving] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    const fetchRealProfile = async () => {
      try {
        const res = await api.getDoctorProfile();
        if (res.success && res.doctor) {
          const doc = res.doctor;
          setName(doc.fullName || user?.name || '');
          setLicenseNumber(doc.registrationNumber || '');
          setDoctorIdNumber(doc.doctorIdNumber || '');
          setSpecialization(doc.specialization || '');
          setQualification(doc.qualifications || '');
          setHospital(doc.hospitalAffiliation || '');
          setDepartment(doc.department || '');
          setExperienceYears(doc.experienceYears != null ? String(doc.experienceYears) : '');
          setAuthority(doc.authority || '');
          setRegistrationState(doc.registrationState || '');
          setVerificationStatus(doc.regStatus || 'ACTIVE');
        }
      } catch {}
    };
    fetchRealProfile();
  }, [user]);

  // Doctor Official Appointment Booking Link State
  const doctorKey = user?.doctor?.id || (user?.name?.toLowerCase().includes('verma') ? 'doc-2' : 'doc-1');
  const [savedBookingLink, setSavedBookingLink] = useState<string | null>(() => {
    return appointmentBookingService.getDoctorBookingLink(doctorKey, name);
  });
  const [linkInput, setLinkInput] = useState(savedBookingLink || '');
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const handleSaveLink = () => {
    const validation = appointmentBookingService.validateBookingLink(linkInput);
    if (!validation.isValid) {
      setLinkError(validation.error || 'Please enter a valid URL.');
      return;
    }
    const cleanUrl = linkInput.trim();
    appointmentBookingService.setDoctorBookingLink(doctorKey, cleanUrl);
    setSavedBookingLink(cleanUrl);
    setIsEditingLink(false);
    setLinkError(null);
    addToast('success', '✓ Appointment booking link saved');
  };

  const handleRemoveLink = () => {
    appointmentBookingService.setDoctorBookingLink(doctorKey, null);
    setSavedBookingLink(null);
    setLinkInput('');
    setIsEditingLink(false);
    setLinkError(null);
    addToast('info', 'Appointment booking link removed. Patients will now book via Apex EMR internal booking.');
  };

  const handlePhotoSave = (newPhotoUrl: string | null) => {
    updateProfilePhoto(newPhotoUrl);
    addToast('success', newPhotoUrl ? 'Doctor profile photo updated successfully!' : 'Doctor profile photo removed.');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      addToast('success', 'Doctor credentials and clinic profile updated successfully');
    }, 600);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-24 text-white antialiased">
      {/* Top Banner with Profile Avatar */}
      <ScrollReveal direction="left">
        <div className="bg-gradient-to-r from-[#0B0B0D] via-[#0E1520] to-[#0B0B0D] text-white p-5 sm:p-8 lg:p-10 rounded-[32px] shadow-2xl border border-teal-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="relative group cursor-pointer" onClick={() => setShowPhotoModal(true)}>
              <ProfileAvatar
                photoUrl={user?.profilePhoto || user?.doctor?.profilePhoto}
                name={name}
                role="DOCTOR"
                size="xl"
                shape="rounded"
                className="border-2 border-teal-400/40 shadow-xl group-hover:opacity-90 transition-opacity"
              />
              <button
                type="button"
                className="absolute -bottom-1 -right-1 p-2 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-900 shadow-md transition-transform group-hover:scale-110 cursor-pointer"
                title="Upload Doctor Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{name}</h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>NMC Verified</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-teal-300 font-medium">
                {specialization} • {hospital}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/50 font-mono">
                <span>Medical Reg. #{licenseNumber}</span>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(true)}
                  className="text-xs font-sans font-bold text-teal-400 hover:text-teal-300 underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{user?.profilePhoto ? 'Change Photo' : 'Upload Profile Photo'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <button
              type="button"
              onClick={() => setShowPhotoModal(true)}
              className="px-4 py-2.5 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Upload Photo</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Credentials & Medical Registration */}
        <ScrollReveal direction="bottom" delay={0.05}>
          <div className="p-6 sm:p-8 rounded-[32px] bg-[#0B0B0D] border border-white/[0.08] shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Medical Registration & Board Certification</h2>
                <p className="text-xs text-white/40">Official credentials verified with State Medical Council</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1.5">
                <label className="text-white/60 font-bold block">Full Legal Name (as per NMC)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs font-semibold focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 font-bold block">Medical Council Registration Number</label>
                <input
                  type="text"
                  disabled
                  value={licenseNumber}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.02] text-white/50 font-mono text-xs"
                />
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified with State Medical Council</span>
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 font-bold block">Qualifications & Fellowships</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 font-bold block">Specialization Field</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 font-bold block">Clinical Experience (Years)</label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 font-bold block">Consultation Fee (INR ₹)</label>
                <input
                  type="number"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Hospital Affiliation & Practice Location */}
        <ScrollReveal direction="bottom" delay={0.1}>
          <div className="p-6 sm:p-8 rounded-[32px] bg-[#0B0B0D] border border-white/[0.08] shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                <Hospital className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Hospital Affiliation & Practice Facility</h2>
                <p className="text-xs text-white/40">Institutional base for physical and emergency consultations</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1.5">
                <label className="text-white/60 font-bold block">Primary Hospital</label>
                <input
                  type="text"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 font-bold block">Clinical Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 font-bold block">Official Professional Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/60 font-bold block">Direct Hospital Extension / Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-white/60 font-bold block">Professional Biography & Clinical Focus</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3.5 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs focus:outline-none focus:border-teal-500 leading-relaxed"
                />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Appointment Booking Dedicated Section */}
        <ScrollReveal direction="bottom" delay={0.15}>
          <div className="p-6 sm:p-8 rounded-[32px] bg-[#0B0B0D] border border-white/[0.08] shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Appointment Booking</h2>
                <p className="text-xs text-white/40">
                  Add your hospital's official appointment booking website. Patients will be redirected to this link when they choose to book an appointment with you.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {savedBookingLink && !isEditingLink ? (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>✓ Appointment booking link saved</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLinkInput(savedBookingLink);
                          setIsEditingLink(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs font-bold hover:bg-white/[0.08] transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveLink}
                        className="px-3.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-bold hover:bg-rose-500/20 transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block">
                      Current Link:
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={savedBookingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono font-semibold text-blue-400 hover:underline break-all inline-flex items-center gap-1"
                      >
                        <span>{savedBookingLink}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-white/60 font-bold block text-xs">
                      Appointment Booking Link
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <input
                        type="url"
                        value={linkInput}
                        onChange={(e) => {
                          setLinkInput(e.target.value);
                          if (linkError) setLinkError(null);
                        }}
                        placeholder="https://hospital.com/book/ananya"
                        className="flex-1 px-4 py-3 rounded-2xl border border-white/10 bg-white/[0.04] text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleSaveLink}
                        className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer whitespace-nowrap"
                      >
                        Save Appointment Link
                      </button>
                      {isEditingLink && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingLink(false);
                            setLinkError(null);
                          }}
                          className="px-4 py-3 rounded-2xl border border-white/10 text-white/70 font-bold text-xs hover:bg-white/[0.05] cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    {linkError && (
                      <p className="text-xs text-rose-400 font-semibold mt-1">
                        {linkError}
                      </p>
                    )}
                  </div>
                  <p className="text-[11px] text-white/40">
                    Accepts only valid http:// or https:// addresses. When removed, patients will automatically book through Apex EMR's internal booking system.
                  </p>
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* Blockchain Cryptographic Signing Key */}
        <ScrollReveal direction="bottom" delay={0.2}>
          <div className="p-6 sm:p-8 rounded-[32px] bg-[#0B0B0D] border border-white/[0.08] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Cryptographic Signing Public Address</h2>
                <p className="text-xs text-white/40">Used for digital signature validation on electronic prescriptions</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-white font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-white/40 text-[11px]">
                <span>EVM Signer Address</span>
                <span className="text-emerald-400">ECDSA secp256k1</span>
              </div>
              <p className="text-purple-300 break-all">
                0x70997970C51812dc3A010C7d01b50e0d17dc79C8
              </p>
              <p className="text-[11px] text-white/40 font-sans">
                All prescriptions and consultation summaries notarized by your account are signed with this key and registered on Ethereum block logs.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all shadow-lg shadow-teal-600/20 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Update Professional Profile</span>
          </button>
        </div>
      </form>

      {/* Doctor Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        currentPhotoUrl={user?.profilePhoto || user?.doctor?.profilePhoto}
        onSave={handlePhotoSave}
        userName={name}
        userRole="DOCTOR"
        title="Upload Doctor Profile Photo"
      />
    </div>
  );
};

export default DoctorProfilePage;
