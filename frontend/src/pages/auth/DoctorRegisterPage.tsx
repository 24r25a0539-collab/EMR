import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  FileCheck,
  AlertCircle,
  Clock,
  User,
  GraduationCap,
  Landmark,
  FileText,
  Upload,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { Header } from '../../components/common/Header';
import { FileUploader } from '../../components/common/FileUploader';
import { api } from '../../services/api';
import { ScrollReveal } from '../../components/common/ScrollReveal';

const STATE_COUNCILS = [
  'Telangana State Medical Council',
  'Andhra Pradesh Medical Council',
  'Maharashtra Medical Council',
  'Karnataka Medical Council',
  'Delhi Medical Council',
  'Tamil Nadu Medical Council',
  'Kerala State Medical Council',
  'Gujarat Medical Council',
  'West Bengal Medical Council',
  'Uttar Pradesh Medical Council',
  'Other State Medical Council',
];

const SPECIALIZATIONS = [
  'Cardiology',
  'Neurology',
  'Dermatology',
  'General Medicine',
  'Pediatrics',
  'Orthopedics',
  'Oncology',
  'Gastroenterology',
  'Pulmonology',
  'Endocrinology',
  'Nephrology',
  'Psychiatry',
];

export const DoctorRegisterPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    // Personal Details
    fullName: '',
    dob: '',
    gender: 'Male',
    mobile: '',
    email: '',
    address: '',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    pincode: '500034',

    // Professional Details
    doctorIdNumber: '',
    registrationNumber: '',
    qualification: 'MBBS, MD',
    university: 'Osmania Medical College',
    specialization: 'Cardiology',
    experienceYears: '8',
    hospitalAffiliation: 'Apex Health City',
    department: 'Cardiology',
    languages: 'English, Hindi, Telugu',

    // Registration Authority
    authorityType: 'State Medical Council', // 'State Medical Council' | 'Central Authority'
    authority: 'Telangana State Medical Council',
    registrationState: 'Telangana',
  });

  // Uploaded Documents State
  const [uploadedDocs, setUploadedDocs] = useState<{
    degreeCertHash?: string;
    degreeCertName?: string;
    regCertHash?: string;
    regCertName?: string;
    govtIdHash?: string;
    govtIdName?: string;
    expCertHash?: string;
    expCertName?: string;
  }>({});

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    applicationId: string;
    status: string;
    govMatchStatus: string;
    isGovMatched: boolean;
    govResult?: any;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleFillDemoDoctor = (type: 'matched' | 'mismatch') => {
    if (type === 'matched') {
      setFormData({
        fullName: 'Dr. Rajesh Verma',
        dob: '1982-05-14',
        gender: 'Male',
        mobile: '9849012345',
        email: `dr.verma.${Date.now().toString().slice(-4)}@carehospital.in`,
        address: 'Road No 1, Banjara Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        pincode: '500034',
        doctorIdNumber: 'NMC-DOC-10021',
        registrationNumber: `TSMC-${Math.floor(100000 + Math.random() * 900000)}`,
        qualification: 'MBBS, MD',
        university: 'Osmania Medical College',
        specialization: 'Neurology',
        experienceYears: '14',
        hospitalAffiliation: 'Care Hospital, Banjara Hills',
        department: 'Neurology',
        languages: 'English, Hindi, Telugu',
        authorityType: 'State Medical Council',
        authority: 'Telangana State Medical Council',
        registrationState: 'Telangana',
      });
      setUploadedDocs({
        degreeCertHash: 'a7f3e84920b84c379a29e46a78241517b6a127a3c9472e3917456d982b14e9f1',
        degreeCertName: 'MBBS_MD_Degree_Certificate.pdf',
        regCertHash: 'c4e9182390a47f612d9481e37b98246a18274d9e38204618a72948e371b294c1',
        regCertName: 'State_Medical_Council_Registration.pdf',
        govtIdHash: 'e194827361a84f923b74918e38294716a8274b9e28374619a8274619b8274618',
        govtIdName: 'Doctor_Govt_Identity_Card.pdf',
      });
      addToast('info', 'Loaded pre-validated mock government matched credentials.');
    } else {
      setFormData({
        fullName: 'Dr. John Doe Unverified',
        dob: '1995-01-01',
        gender: 'Male',
        mobile: '9849099999',
        email: `dr.mismatch.${Date.now().toString().slice(-4)}@test.in`,
        address: '123 Fake Street',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        pincode: '500001',
        doctorIdNumber: 'INV-DOC-99999',
        registrationNumber: `MISMATCH-${Math.floor(100000 + Math.random() * 900000)}`,
        qualification: 'MBBS',
        university: 'Unknown College',
        specialization: 'General Medicine',
        experienceYears: '2',
        hospitalAffiliation: 'Private Clinic',
        department: 'General',
        languages: 'English',
        authorityType: 'State Medical Council',
        authority: 'Telangana State Medical Council',
        registrationState: 'Telangana',
      });
      setUploadedDocs({
        degreeCertHash: 'fakehash1234567890abcdef',
        degreeCertName: 'Provisional_Certificate.pdf',
      });
      addToast('warning', 'Loaded mismatch test credentials for testing government mismatch detection.');
    }
  };

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (!formData.fullName.trim()) errs.fullName = 'Doctor full name is required.';
      if (!formData.dob) errs.dob = 'Date of birth is required.';
      if (!formData.mobile.trim()) errs.mobile = 'Mobile number is required.';
      else if (!/^\d{10}$/.test(formData.mobile.replace(/\D/g, '').slice(-10))) {
        errs.mobile = 'Enter a valid 10-digit mobile number.';
      }
      if (!formData.email.trim()) errs.email = 'Clinical email address is required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errs.email = 'Enter a valid email address.';
      }
      if (!formData.address.trim()) errs.address = 'Clinic or residential address is required.';
      if (!formData.city.trim()) errs.city = 'City is required.';
      if (!formData.pincode.trim()) errs.pincode = 'Pincode is required.';
    } else if (step === 2) {
      if (!formData.registrationNumber.trim()) errs.registrationNumber = 'Medical Registration / Licence Number is required.';
      if (!formData.qualification.trim()) errs.qualification = 'Primary medical qualification is required.';
      if (!formData.university.trim()) errs.university = 'Medical University / Institution is required.';
      if (!formData.specialization.trim()) errs.specialization = 'Primary clinical specialization is required.';
    } else if (step === 3) {
      if (!formData.authority.trim()) errs.authority = 'Medical Council / Authority name is required.';
      if (formData.authorityType === 'State Medical Council' && !formData.registrationState.trim()) {
        errs.registrationState = 'Registration state is required.';
      }
    } else if (step === 4) {
      if (!uploadedDocs.degreeCertHash) {
        errs.documents = 'Medical Degree Certificate is mandatory. Please upload your degree certificate.';
      } else if (!uploadedDocs.regCertHash) {
        errs.documents = 'Medical Registration Certificate is mandatory. Please upload your council registration certificate.';
      } else if (!uploadedDocs.govtIdHash) {
        errs.documents = 'Government Identity Document is mandatory. Please upload your government ID proof.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(5, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      addToast('error', 'Please resolve all required fields before proceeding.');
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      addToast('error', 'Please complete all required registration fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        certificates: [
          ...(uploadedDocs.degreeCertHash ? [{ name: 'Medical Degree Certificate', hash: uploadedDocs.degreeCertHash, fileName: uploadedDocs.degreeCertName }] : []),
          ...(uploadedDocs.regCertHash ? [{ name: 'Medical Registration Certificate', hash: uploadedDocs.regCertHash, fileName: uploadedDocs.regCertName }] : []),
          ...(uploadedDocs.govtIdHash ? [{ name: 'Government Identity Document', hash: uploadedDocs.govtIdHash, fileName: uploadedDocs.govtIdName }] : []),
          ...(uploadedDocs.expCertHash ? [{ name: 'Experience Certificate', hash: uploadedDocs.expCertHash, fileName: uploadedDocs.expCertName }] : []),
        ],
        uploadedLicenseHash: uploadedDocs.regCertHash || uploadedDocs.degreeCertHash,
      };

      const res = await api.doctorRegister(payload);
      setSubmissionResult({
        applicationId: res.applicationId || 'DR-10001',
        status: res.status || 'PENDING',
        govMatchStatus: res.govMatchStatus || (res.isGovMatched ? 'GOVERNMENT_MATCHED' : 'GOVERNMENT_MISMATCH'),
        isGovMatched: !!res.isGovMatched,
        govResult: res.govVerificationResult,
      });
      addToast('success', 'Application submitted to Administrator accreditation queue.');
    } catch (err: any) {
      addToast('error', err.message || 'Doctor registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] flex flex-col antialiased text-white selection:bg-teal-500/20 selection:text-teal-300">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {submissionResult ? (
          /* Submission Confirmation Card */
          <ScrollReveal direction="up" className="bg-[#0B0B0D] p-6 sm:p-10 rounded-3xl shadow-2xl border border-white/10 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20 shadow-lg shadow-amber-950/40">
                <Clock className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300 bg-amber-950/60 px-3.5 py-1 rounded-full border border-amber-800">
                  Status: {submissionResult.status}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white mt-3 tracking-tight">
                  Application Submitted Successfully
                </h1>
                <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-md mx-auto leading-relaxed">
                  Thank you, Dr. {formData.fullName}. Your accreditation dossier has been submitted for
                  administrative verification.
                </p>
              </div>
            </div>

            {/* Application Details Summary */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#141416] border border-white/10 text-xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-white/50">Application Reference ID:</span>
                <span className="font-mono font-bold text-teal-300 text-sm">
                  {submissionResult.applicationId}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-white/50">Medical Licence Number:</span>
                <span className="font-mono font-bold text-white">
                  {formData.registrationNumber}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-white/50">Licensing Authority:</span>
                <span className="font-semibold text-white/90">
                  {formData.authority} ({formData.authorityType})
                </span>
              </div>

              {/* Government Verification Outcome Preview */}
              <div className="pt-1">
                <span className="text-white/50 block mb-1.5">Government Registry Comparison:</span>
                {submissionResult.isGovMatched ? (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>✓ Government Details Matched (NMC / State Council Record Validated)</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>⚠ Government Details Require Administrator Manual Review</span>
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps Explanatory Notice */}
            <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-800/60 text-xs text-teal-200 space-y-1.5 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-teal-400" />
                <span>Next Steps in the Doctor Activation Workflow:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-white/70">
                <li>A hospital administrator will review your medical credentials and government verification status.</li>
                <li>Upon administrative approval, your account will be activated and a secure random temporary password will be issued.</li>
                <li>You will sign in using your Medical Licence Number and the temporary password, which will prompt you to set your own permanent password.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/doctor/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#050506] font-bold transition-colors shadow-lg shadow-teal-950/40 text-xs text-center"
              >
                Return to Doctor Login
              </Link>
            </div>
          </ScrollReveal>
        ) : (
          /* Multi-Step Wizard */
          <ScrollReveal direction="up" className="bg-[#0B0B0D] p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/10 space-y-6">
            {/* Header & Demo Autofill Buttons */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/60 text-teal-300 text-xs font-bold uppercase tracking-wider border border-teal-800">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                  <span>Practitioner Registration</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFillDemoDoctor('matched')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 text-[11px] font-bold border border-emerald-800 hover:bg-emerald-900 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Autofill Gov Matched</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemoDoctor('mismatch')}
                    className="px-2.5 py-1 rounded-lg bg-amber-950/60 text-amber-300 text-[11px] font-bold border border-amber-800 hover:bg-amber-900 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>Autofill Mismatch Test</span>
                  </button>
                </div>
              </div>

              <h1 className="text-2xl font-black text-white tracking-tight">
                Apply for Doctor Accreditation
              </h1>
              <p className="text-xs text-white/50 mt-1">
                Every physician is field-by-field verified against medical council registries before sovereign EMR authorization.
              </p>
            </div>

            {/* Stepper Progress Bar */}
            <div className="py-2 border-y border-white/10">
              <div className="flex items-center justify-between text-xs font-bold">
                {[
                  { step: 1, label: 'Personal Details', icon: User },
                  { step: 2, label: 'Professional Details', icon: GraduationCap },
                  { step: 3, label: 'Medical Council', icon: Landmark },
                  { step: 4, label: 'Certificates', icon: FileText },
                  { step: 5, label: 'Review & Submit', icon: CheckCircle2 },
                ].map(({ step, label, icon: Icon }) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => {
                      if (step < currentStep || validateStep(currentStep)) {
                        setCurrentStep(step);
                      }
                    }}
                    className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                      currentStep === step
                        ? 'text-teal-300 font-black'
                        : currentStep > step
                        ? 'text-emerald-400'
                        : 'text-white/30'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        currentStep === step
                          ? 'bg-teal-500 text-[#050506]'
                          : currentStep > step
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-[#141416] text-white/40 border border-white/10'
                      }`}
                    >
                      {currentStep > step ? '✓' : step}
                    </div>
                    <span className="hidden md:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step Forms */}
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              {/* STEP 1: Personal Details */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-400" />
                    <span>Step 1: Personal Information</span>
                  </h2>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                      Full Name (as per Medical Council) *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Dr. Rajesh Verma"
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 placeholder-white/30"
                    />
                    {errors.fullName && <p className="text-rose-400 text-[11px] mt-1">{errors.fullName}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40"
                      />
                      {errors.dob && <p className="text-rose-400 text-[11px] mt-1">{errors.dob}</p>}
                    </div>

                    <div>
                      <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                        Gender *
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="e.g. 9849012345"
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 placeholder-white/30"
                      />
                      {errors.mobile && <p className="text-rose-400 text-[11px] mt-1">{errors.mobile}</p>}
                    </div>

                    <div>
                      <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                        Clinical Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. dr.verma@carehospital.in"
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 placeholder-white/30"
                      />
                      {errors.email && <p className="text-rose-400 text-[11px] mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                      Clinic / Residential Address *
                    </label>
                    <textarea
                      rows={2}
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g. Road No 1, Banjara Hills"
                      className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 placeholder-white/30"
                    />
                    {errors.address && <p className="text-rose-400 text-[11px] mt-1">{errors.address}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Professional Details */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-teal-400" />
                    <span>Step 2: Professional Credentials</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                        Medical Registration / Licence No *
                      </label>
                      <input
                        type="text"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        placeholder="e.g. TSMC-458721"
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm font-mono focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40"
                      />
                      {errors.registrationNumber && <p className="text-rose-400 text-[11px] mt-1">{errors.registrationNumber}</p>}
                    </div>

                    <div>
                      <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                        National Doctor ID / Govt ID
                      </label>
                      <input
                        type="text"
                        name="doctorIdNumber"
                        value={formData.doctorIdNumber}
                        onChange={handleChange}
                        placeholder="e.g. NMC-DOC-10021"
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm font-mono focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                        Primary Qualification *
                      </label>
                      <input
                        type="text"
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleChange}
                        placeholder="e.g. MBBS, MD (General Medicine)"
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40"
                      />
                      {errors.qualification && <p className="text-rose-400 text-[11px] mt-1">{errors.qualification}</p>}
                    </div>

                    <div>
                      <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                        Medical University / Institution *
                      </label>
                      <input
                        type="text"
                        name="university"
                        value={formData.university}
                        onChange={handleChange}
                        placeholder="e.g. Osmania Medical College"
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                        Clinical Specialization *
                      </label>
                      <select
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40"
                      >
                        {SPECIALIZATIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                        Clinical Experience (Years)
                      </label>
                      <input
                        type="number"
                        name="experienceYears"
                        value={formData.experienceYears}
                        onChange={handleChange}
                        min={0}
                        max={60}
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                        Hospital Affiliation
                      </label>
                      <input
                        type="text"
                        name="hospitalAffiliation"
                        value={formData.hospitalAffiliation}
                        onChange={handleChange}
                        placeholder="e.g. Apex Health City, Jubilee Hills"
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40"
                      />
                    </div>

                    <div>
                      <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                        Consultation Languages
                      </label>
                      <input
                        type="text"
                        name="languages"
                        value={formData.languages}
                        onChange={handleChange}
                        placeholder="e.g. English, Hindi, Telugu"
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Registration Authority */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-teal-400" />
                    <span>Step 3: Registration Authority</span>
                  </h2>

                  <div>
                    <label className="block font-bold uppercase tracking-wider text-white/70 mb-2">
                      Registration Authority Type *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            authorityType: 'State Medical Council',
                            authority: 'Telangana State Medical Council',
                          }));
                        }}
                        className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          formData.authorityType === 'State Medical Council'
                            ? 'border-teal-500 bg-teal-950/40 text-teal-200 font-bold ring-1 ring-teal-500/40 shadow-md'
                            : 'border-white/10 bg-[#141416] hover:bg-white/5 text-white/70 hover:text-white'
                        }`}
                      >
                        <Building2 className="w-5 h-5 text-teal-400" />
                        <div>
                          <div className="text-xs font-bold">State Medical Council</div>
                          <div className="text-[10px] text-white/50">State-level practitioner licensing body</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            authorityType: 'Central Authority',
                            authority: 'National Medical Commission',
                          }));
                        }}
                        className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          formData.authorityType === 'Central Authority'
                            ? 'border-teal-500 bg-teal-950/40 text-teal-200 font-bold ring-1 ring-teal-500/40 shadow-md'
                            : 'border-white/10 bg-[#141416] hover:bg-white/5 text-white/70 hover:text-white'
                        }`}
                      >
                        <Landmark className="w-5 h-5 text-teal-400" />
                        <div>
                          <div className="text-xs font-bold">Central Authority</div>
                          <div className="text-[10px] text-white/50">National Medical Commission (NMC/MCI)</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {formData.authorityType === 'State Medical Council' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                          Select State Medical Council *
                        </label>
                        <select
                          name="authority"
                          value={formData.authority}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40"
                        >
                          {STATE_COUNCILS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                          Registration State *
                        </label>
                        <input
                          type="text"
                          name="registrationState"
                          value={formData.registrationState}
                          onChange={handleChange}
                          placeholder="e.g. Telangana"
                          className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block font-bold uppercase tracking-wider text-white/70 mb-1">
                        Central Authority Name
                      </label>
                      <input
                        type="text"
                        name="authority"
                        value={formData.authority}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Certificates / Documents */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-400" />
                    <span>Step 4: Professional Certificates & Proofs</span>
                  </h2>
                  <p className="text-xs text-white/50">
                    Upload official degree and registration documents. Files are cryptographically hashed for tamper-proof registry compliance.
                  </p>

                  <div className="space-y-4">
                    {/* 1. Medical Degree Certificate */}
                    <div className="p-4 rounded-2xl bg-[#141416] border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-white">
                          1. Medical Degree Certificate (MBBS / MD / MS) *
                        </label>
                        {uploadedDocs.degreeCertHash ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>✓ Uploaded</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800 font-bold text-[11px] flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>⚠ Required</span>
                          </span>
                        )}
                      </div>
                      <FileUploader
                        label="Upload Medical Degree Certificate"
                        onFileSelect={(file, hash) =>
                          setUploadedDocs((prev) => ({ ...prev, degreeCertHash: hash, degreeCertName: file.name }))
                        }
                      />
                      {uploadedDocs.degreeCertName && (
                        <p className="text-[11px] text-emerald-400 font-mono">File: {uploadedDocs.degreeCertName}</p>
                      )}
                    </div>

                    {/* 2. Medical Registration Certificate */}
                    <div className="p-4 rounded-2xl bg-[#141416] border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-white">
                          2. Medical Registration Certificate *
                        </label>
                        {uploadedDocs.regCertHash ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>✓ Uploaded</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800 font-bold text-[11px] flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>⚠ Required</span>
                          </span>
                        )}
                      </div>
                      <FileUploader
                        label="Upload Medical Registration Certificate"
                        onFileSelect={(file, hash) =>
                          setUploadedDocs((prev) => ({ ...prev, regCertHash: hash, regCertName: file.name }))
                        }
                      />
                      {uploadedDocs.regCertName && (
                        <p className="text-[11px] text-emerald-400 font-mono">File: {uploadedDocs.regCertName}</p>
                      )}
                    </div>

                    {/* 3. Government Identity Document */}
                    <div className="p-4 rounded-2xl bg-[#141416] border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-white">
                          3. Government Identity Document (Aadhaar / Passport) *
                        </label>
                        {uploadedDocs.govtIdHash ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>✓ Uploaded</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-800 font-bold text-[11px] flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>⚠ Required</span>
                          </span>
                        )}
                      </div>
                      <FileUploader
                        label="Upload Government Identity Document"
                        onFileSelect={(file, hash) =>
                          setUploadedDocs((prev) => ({ ...prev, govtIdHash: hash, govtIdName: file.name }))
                        }
                      />
                      {uploadedDocs.govtIdName && (
                        <p className="text-[11px] text-emerald-400 font-mono">File: {uploadedDocs.govtIdName}</p>
                      )}
                    </div>
                  </div>

                  {errors.documents && (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{errors.documents}</span>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: Review & Submit */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    <span>Step 5: Review Application Summary</span>
                  </h2>

                  <div className="p-4 rounded-2xl bg-[#141416] border border-white/10 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-white/10">
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase font-bold">Doctor Full Name</span>
                        <span className="font-bold text-white text-sm">{formData.fullName}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase font-bold">Date of Birth & Gender</span>
                        <span className="font-medium text-white/80">{formData.dob} ({formData.gender})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-white/10">
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase font-bold">Registration / Licence No</span>
                        <span className="font-mono font-bold text-teal-300">{formData.registrationNumber}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase font-bold">Licensing Authority</span>
                        <span className="font-medium text-white/80">{formData.authority}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-white/10">
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase font-bold">Qualification & Specialization</span>
                        <span className="font-medium text-white/80">{formData.qualification} — {formData.specialization}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase font-bold">Experience & Hospital</span>
                        <span className="font-medium text-white/80">{formData.experienceYears} Years • {formData.hospitalAffiliation}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase font-bold">Email & Contact</span>
                        <span className="font-medium text-white/80">{formData.email} • {formData.mobile}</span>
                      </div>
                      <div>
                        <span className="text-white/40 block text-[10px] uppercase font-bold">Attached Documents</span>
                        <span className="font-medium text-emerald-400">
                          {[
                            uploadedDocs.regCertName ? 'Registration Cert' : '',
                            uploadedDocs.degreeCertName ? 'Degree Cert' : '',
                            uploadedDocs.govtIdName ? 'Govt ID' : '',
                          ].filter(Boolean).join(', ') || 'Uploaded via Portal'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-200 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Legal Declaration</span>
                    </p>
                    <p>
                      I hereby declare that all clinical degrees, registration licences, and personal credentials submitted
                      are genuine and accredited by the competent statutory authority.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-white/80 font-bold hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#050506] font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-teal-950/40 cursor-pointer"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#050506] font-bold transition-colors flex items-center gap-2 shadow-lg shadow-teal-950/40 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Submit Registration</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            <div className="text-center text-xs text-white/40 pt-2">
              Already approved?{' '}
              <Link to="/doctor/login" className="font-bold text-teal-400 hover:underline">
                Sign In to Practitioner Portal
              </Link>
            </div>
          </ScrollReveal>
        )}
      </main>
    </div>
  );
};

export default DoctorRegisterPage;
