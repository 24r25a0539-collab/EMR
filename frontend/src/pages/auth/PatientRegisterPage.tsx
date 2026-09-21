import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Phone,
  User,
  HeartPulse,
  Copy,
  Check,
  Lock,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Info,
  Calendar,
  MapPin,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Header } from '../../components/common/Header';
import {
  patientAuthService,
  StoredPatientRecord,
  GenderType,
  BloodGroupType,
  RelationshipType,
} from '../../services/patientAuthService';
import { api } from '../../services/api';
import { ScrollReveal } from '../../components/common/ScrollReveal';

export const PatientRegisterPage: React.FC = () => {
  const { t } = useLanguage();
  const { loginPatient } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Registration step: 1: Mobile, 2: Personal, 3: Health & Emergency, 4: Identity, 5: Processing, 6: Success
  const [currentStep, setCurrentStep] = useState<number>(1);

  // STEP 1 State: Mobile Verification
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [devOtpHint, setDevOtpHint] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState<number>(30);
  const [isMobileVerified, setIsMobileVerified] = useState<boolean>(false);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // STEP 2 State: Personal Details
  const [fullName, setFullName] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState<GenderType>('Male');
  const [address, setAddress] = useState<string>('');
  const [email, setEmail] = useState<string>('');

  // STEP 3 State: Health & Emergency
  const [bloodGroup, setBloodGroup] = useState<BloodGroupType>('O+');
  const [emergencyName, setEmergencyName] = useState<string>('');
  const [emergencyRelationship, setEmergencyRelationship] = useState<RelationshipType>('Spouse');
  const [emergencyMobile, setEmergencyMobile] = useState<string>('');
  const [emergencyEmail, setEmergencyEmail] = useState<string>('');
  const [emergencyAddress, setEmergencyAddress] = useState<string>('');

  // STEP 4 State: Identity & ABHA
  const [aadhaarInput, setAadhaarInput] = useState<string>('');
  const [showAadhaar, setShowAadhaar] = useState<boolean>(false);
  const [abhaId, setAbhaId] = useState<string>('');
  const [identityConfirmed, setIdentityConfirmed] = useState<boolean>(false);

  // STEP 5 & 6 State: Processing & Success
  const [processingStage, setProcessingStage] = useState<number>(1);
  const [registeredPatient, setRegisteredPatient] = useState<StoredPatientRecord | null>(null);
  const [registeredToken, setRegisteredToken] = useState<string | null>(null);
  const [registeredUser, setRegisteredUser] = useState<any | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Inline Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Derived Age calculation from DOB
  const derivedAge = dateOfBirth ? patientAuthService.calculateAge(dateOfBirth) : 0;

  // Countdown timer for OTP resend in Step 1
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOtpSent && otpTimer > 0 && !isMobileVerified) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOtpSent, otpTimer, isMobileVerified]);

  // Handle Send OTP (Step 1)
  const handleSendOtp = async () => {
    const clean = mobileNumber.replace(/\D/g, '');
    if (clean.length !== 10) {
      setErrors({ mobile: 'Please enter a valid 10-digit Indian mobile number.' });
      return;
    }
    setErrors({});
    try {
      const res = await api.patientRegistrationRequestOtp(clean);
      if (res && res.success) {
        setDevOtpHint(res.devOtpHint || '');
        setIsOtpSent(true);
        setOtpTimer(30);
        setOtpDigits(['', '', '', '', '', '']);
        addToast('info', `${t('auth.reg.otpSentTo')} +91 ${clean.slice(0, 2)}XXX X${clean.slice(6)}`);
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
      } else {
        throw new Error(res?.message || 'Failed to dispatch verification code.');
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to dispatch verification code.';
      setErrors({ mobile: msg });
      addToast('error', msg);
    }
  };

  // OTP Input management
  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = val.slice(-1);
    setOtpDigits(newDigits);
    if (val && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste) {
      const arr = paste.split('');
      const updated = [...otpDigits];
      arr.forEach((ch, idx) => {
        if (idx < 6) updated[idx] = ch;
      });
      setOtpDigits(updated);
      otpInputsRef.current[Math.min(arr.length, 5)]?.focus();
    }
  };

  // Handle Verify OTP (Step 1)
  const handleVerifyOtp = async () => {
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setErrors({ otp: 'Please enter all 6 digits of the verification code.' });
      return;
    }
    const clean = mobileNumber.replace(/\D/g, '');
    try {
      const res = await api.patientRegistrationVerifyOtp(clean, code);
      if (res && res.success) {
        setErrors({});
        setIsMobileVerified(true);
        addToast('success', t('auth.reg.mobileVerified'));
        setTimeout(() => {
          setCurrentStep(2);
        }, 400);
      } else {
        throw new Error(res?.message || 'Invalid OTP.');
      }
    } catch (err: any) {
      const msg = err.message || 'Invalid OTP. Please check the code.';
      setErrors({ otp: msg });
      addToast('error', msg);
    }
  };

  // Validate Step 2: Personal Details
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) {
      newErrors.fullName = 'Full legal name is required.';
    }
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required.';
    } else {
      const selectedYear = new Date(dateOfBirth).getFullYear();
      if (selectedYear < 1900 || selectedYear > 2026) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth.';
      }
    }
    if (!address.trim()) {
      newErrors.address = 'Residential address is required.';
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please provide a valid email format (e.g. name@domain.com).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 3: Health & Emergency
  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!emergencyName.trim()) {
      newErrors.emergencyName = 'Emergency contact full name is required.';
    }
    const cleanEmergencyPhone = emergencyMobile.replace(/\D/g, '');
    if (cleanEmergencyPhone.length !== 10) {
      newErrors.emergencyMobile = 'A valid 10-digit emergency contact phone number is required.';
    }
    if (cleanEmergencyPhone === mobileNumber.replace(/\D/g, '')) {
      newErrors.emergencyMobile = 'Emergency phone should be different from your own mobile number.';
    }
    if (emergencyEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emergencyEmail.trim())) {
      newErrors.emergencyEmail = 'Please provide a valid emergency email address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 4: Identity & Register
  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const cleanAadhaar = aadhaarInput.replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) {
      newErrors.aadhaar = 'A valid 12-digit Aadhaar number is required for verification.';
    }
    const cleanAbha = abhaId.replace(/\D/g, '');
    if (!abhaId.trim()) {
      newErrors.abha = 'ABHA ID is mandatory for patient registration.';
    } else if (cleanAbha.length !== 14) {
      newErrors.abha = 'A valid 14-digit ABHA ID is required (e.g. 12-3456-7890-1234).';
    }
    if (!identityConfirmed) {
      newErrors.consent = 'Please confirm that the identity details provided are correct.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 4 -> Step 5 -> Step 6: Registration Execution
  const handleRegister = async () => {
    if (!validateStep4()) return;

    setCurrentStep(5);
    setProcessingStage(2);

    const cleanAadhaar = aadhaarInput.replace(/\D/g, '');
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    const formattedAbha = abhaId.includes('-')
      ? abhaId.trim()
      : `${abhaId.replace(/\D/g, '').slice(0, 2)}-${abhaId.replace(/\D/g, '').slice(2, 6)}-${abhaId.replace(/\D/g, '').slice(6, 10)}-${abhaId.replace(/\D/g, '').slice(10, 14)}`;

    // Wipe plain Aadhaar from state memory immediately
    setAadhaarInput('');

    const payload = {
      fullName: fullName.trim(),
      dob: dateOfBirth,
      gender,
      mobile: cleanMobile,
      email: email.trim() || undefined,
      address: address.trim() || 'Not specified',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      pincode: '500001',
      bloodGroup,
      govtIdType: 'Aadhaar',
      govtIdNumber: cleanAadhaar,
      abhaId: formattedAbha,
      emergencyContactName: emergencyName.trim(),
      emergencyContactPhone: emergencyMobile.replace(/\D/g, ''),
      emergencyContactRelation: emergencyRelationship,
    };

    try {
      const response = await api.patientRegister(payload);

      if (response && response.success && response.healthId) {
        // Build registered summary using the server-generated Health ID from PostgreSQL
        const patientSummary: StoredPatientRecord = {
          healthcareId: response.healthId,
          fullName: response.user?.patient?.fullName || fullName.trim(),
          dateOfBirth,
          age: derivedAge,
          gender,
          address: address.trim(),
          email: email.trim() || undefined,
          mobileNumber: cleanMobile,
          bloodGroup,
          maskedAadhaar: patientAuthService.maskAadhaar(cleanAadhaar),
          abhaId: formattedAbha,
          emergencyContact: {
            fullName: emergencyName.trim(),
            relationship: emergencyRelationship,
            mobileNumber: emergencyMobile.replace(/\D/g, ''),
            email: emergencyEmail.trim() || undefined,
            address: emergencyAddress.trim() || undefined,
          },
          mobileVerified: true,
          registrationStatus: 'ACTIVE',
          createdAt: new Date().toISOString(),
          profilePhoto: undefined,
        };

        setRegisteredPatient(patientSummary);
        setRegisteredToken(response.token || null);
        setRegisteredUser(response.user || null);
        setCurrentStep(6);
        addToast('success', `${t('auth.reg.welcome')}! ${t('auth.reg.successTitle')}`);
      } else {
        throw new Error(response?.message || response?.error || 'Registration failed. Please try again.');
      }
    } catch (err: any) {
      let friendlyError = err.message || 'Registration failed. Please try again.';
      if (friendlyError.toLowerCase().includes('already exists') || friendlyError.toLowerCase().includes('already registered')) {
        friendlyError = 'This mobile number or ABHA ID is already registered. Please login using your Healthcare ID, ABHA ID, or mobile number.';
      } else if (friendlyError.toLowerCase().includes('failed to fetch') || friendlyError.toLowerCase().includes('network') || friendlyError.toLowerCase().includes('connect')) {
        friendlyError = 'Unable to connect to registration server. Please ensure the backend service is running.';
      }
      addToast('error', friendlyError);
      setCurrentStep(4);
    }
  };

  // Copy Healthcare ID to clipboard
  const handleCopyHealthId = () => {
    if (!registeredPatient) return;
    navigator.clipboard.writeText(registeredPatient.healthcareId);
    setIsCopied(true);
    addToast('success', t('auth.reg.healthIdCopied'));
    setTimeout(() => setIsCopied(false), 3000);
  };

  // Continue to Login
  const handleContinueToLogin = () => {
    navigate('/patient/login');
  };

  // Go to Patient Home (directly authenticate with backend token and user)
  const handleGoToPatientHome = () => {
    if (!registeredPatient) {
      navigate('/patient/login');
      return;
    }

    if (registeredToken && registeredUser) {
      loginPatient(registeredToken, registeredUser);
      navigate('/patient/home');
      return;
    }

    navigate('/patient/login');
  };

  // Step names for progress bar
  const stepLabels = [
    t('auth.reg.step1'), // Mobile Verification
    t('auth.reg.step2'), // Personal Details
    t('auth.reg.step3'), // Health & Emergency
    t('auth.reg.step4'), // Identity Verification
    t('auth.reg.step5'), // Complete
  ];

  return (
    <div className="min-h-screen bg-[#050506] flex flex-col antialiased text-white selection:bg-teal-500/20 selection:text-teal-300">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14">
        {/* Step Indicator (Steps 1 to 4) */}
        {currentStep <= 4 && (
          <ScrollReveal direction="down" className="mb-8 bg-[#0B0B0D] p-4 sm:p-5 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-teal-300 bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-800">
                Step {currentStep} of 4: {stepLabels[currentStep - 1]}
              </span>
              <span className="text-xs font-medium text-white/50">
                {Math.round((currentStep / 4) * 100)}% Completed
              </span>
            </div>

            {/* Stepper Dots & Bar */}
            <div className="relative">
              <div className="w-full bg-[#141416] h-2 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>

              <div className="flex justify-between mt-2.5">
                {[1, 2, 3, 4].map((stepNum) => (
                  <button
                    key={stepNum}
                    type="button"
                    disabled={stepNum > currentStep}
                    onClick={() => {
                      if (stepNum < currentStep) setCurrentStep(stepNum);
                    }}
                    className={`flex items-center gap-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                      stepNum === currentStep
                        ? 'text-teal-300 font-bold'
                        : stepNum < currentStep
                        ? 'text-white/70 hover:text-teal-400'
                        : 'text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        stepNum < currentStep
                          ? 'bg-teal-500 text-[#050506]'
                          : stepNum === currentStep
                          ? 'bg-teal-950 text-teal-300 border border-teal-500'
                          : 'bg-[#141416] text-white/40 border border-white/10'
                      }`}
                    >
                      {stepNum < currentStep ? '✓' : stepNum}
                    </span>
                    <span className="hidden sm:inline">{stepLabels[stepNum - 1]}</span>
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Main Card Container */}
        <ScrollReveal direction="up" className="bg-[#0B0B0D] p-6 sm:p-10 rounded-3xl shadow-2xl border border-white/10">
          {/* ============================================================ */}
          {/* STEP 1: MOBILE VERIFICATION */}
          {/* ============================================================ */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-3">
                  <Phone className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {t('auth.reg.title')}
                </h1>
                <p className="text-sm text-white/60 mt-1">
                  {t('auth.reg.subtitle')}
                </p>
              </div>

              {!isOtpSent ? (
                /* Enter Mobile */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                      {t('auth.reg.mobileNumber')} *
                    </label>
                    <div className="flex gap-2">
                      <div className="w-24 px-3 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm font-semibold flex items-center justify-center gap-1.5">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <div className="relative flex-1">
                        <input
                          type="tel"
                          value={mobileNumber}
                          maxLength={10}
                          onChange={(e) => {
                            setMobileNumber(e.target.value.replace(/\D/g, ''));
                            if (errors.mobile) setErrors({});
                          }}
                          placeholder={t('auth.reg.mobilePlaceholder')}
                          className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-1 transition-all font-medium bg-[#141416] text-white ${
                            errors.mobile
                              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/40'
                              : 'border-white/10 focus:border-teal-500 focus:ring-teal-500/40 placeholder-white/30'
                          }`}
                          autoFocus
                        />
                      </div>
                    </div>
                    {errors.mobile && (
                      <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{errors.mobile}</span>
                      </p>
                    )}
                    <p className="text-[11px] text-white/40 mt-1.5">
                      We will send a 6-digit verification code to verify your mobile number.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="w-full py-3.5 rounded-xl bg-teal-500 text-[#050506] font-bold hover:bg-teal-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-950/40 text-sm cursor-pointer"
                  >
                    <span>{t('auth.reg.sendOtp')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Enter & Verify OTP */
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-[#141416] border border-teal-500/30 text-white text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white/70">
                          {t('auth.reg.otpSentTo')}
                        </p>
                        <p className="text-sm font-bold text-teal-300 mt-0.5">
                          +91 {mobileNumber.slice(0, 2)}XXX X{mobileNumber.slice(6)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsOtpSent(false);
                          setOtpDigits(['', '', '', '', '', '']);
                          setErrors({});
                        }}
                        className="text-teal-300 font-bold hover:underline text-xs bg-[#0B0B0D] px-2.5 py-1 rounded-lg border border-white/10 shadow-xs cursor-pointer"
                      >
                        {t('auth.reg.changeMobile')}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                      {t('auth.reg.enterOtp')}
                    </label>
                    <div className="flex justify-between gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            otpInputsRef.current[idx] = el;
                          }}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-11 sm:w-13 h-13 sm:h-14 text-center text-xl font-bold rounded-xl border border-white/10 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 text-white bg-[#141416]"
                        />
                      ))}
                    </div>
                    {errors.otp && (
                      <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{errors.otp}</span>
                      </p>
                    )}

                    {/* Development Mode Dynamic OTP Banner */}
                    {devOtpHint ? (
                      <div className="mt-3 p-2.5 rounded-xl bg-teal-950/40 border border-teal-800/60 text-xs text-teal-200 flex items-center justify-between">
                        <span className="font-semibold text-[11px]">Development Mode</span>
                        <strong className="font-mono text-sm tracking-widest bg-[#050506] px-2.5 py-0.5 rounded border border-teal-500/30 text-teal-300">
                          Demo OTP: {devOtpHint}
                        </strong>
                      </div>
                    ) : null}
                  </div>

                  {/* Resend & Countdown */}
                  <div className="flex items-center justify-between text-xs text-white/50 pt-1">
                    <span>{t('auth.reg.didntReceive')}</span>
                    {otpTimer > 0 ? (
                      <span className="font-semibold text-white/60">
                        {t('auth.reg.resendIn')} {otpTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-teal-400 font-bold hover:underline cursor-pointer"
                      >
                        {t('auth.reg.resendOtp')}
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="w-full py-3.5 rounded-xl bg-teal-500 text-[#050506] font-bold hover:bg-teal-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-950/40 text-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('auth.reg.verifyOtp')}</span>
                  </button>
                </div>
              )}

              {/* Login redirection */}
              <div className="pt-4 border-t border-white/10 text-center text-xs text-white/50">
                <span>Already registered with Apex EMR? </span>
                <Link to="/patient/login" className="font-bold text-teal-400 hover:underline">
                  Sign In to your account
                </Link>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: PERSONAL DETAILS */}
          {/* ============================================================ */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-3">
                  <User className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {t('auth.reg.personalTitle')}
                </h1>
                <p className="text-sm text-white/60 mt-1">
                  {t('auth.reg.personalSubtitle')}
                </p>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    {t('auth.reg.fullName')} *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                    }}
                    placeholder={t('auth.reg.fullNamePlaceholder')}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-1 transition-all bg-[#141416] text-white ${
                      errors.fullName
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/40'
                        : 'border-white/10 focus:border-teal-500 focus:ring-teal-500/40 placeholder-white/30'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.fullName}</span>
                    </p>
                  )}
                </div>

                {/* DOB & Age Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                      {t('auth.reg.dob')} *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dateOfBirth}
                        max="2026-09-15"
                        onChange={(e) => {
                          setDateOfBirth(e.target.value);
                          if (errors.dateOfBirth) setErrors((prev) => ({ ...prev, dateOfBirth: '' }));
                        }}
                        className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-1 transition-all bg-[#141416] text-white ${
                          errors.dateOfBirth
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/40'
                            : 'border-white/10 focus:border-teal-500 focus:ring-teal-500/40'
                        }`}
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{errors.dateOfBirth}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                      {t('auth.reg.age')}
                    </label>
                    <div className="px-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-white text-sm font-semibold flex items-center justify-between">
                      <span>{dateOfBirth ? `${derivedAge} years` : '—'}</span>
                      <span className="text-[10px] text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded-md font-medium border border-teal-800">
                        {t('auth.reg.derivedAge')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    {t('auth.reg.gender')} *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Male', 'Female', 'Other', 'Prefer not to say'] as GenderType[]).map(
                      (g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                            gender === g
                              ? 'bg-teal-500 text-[#050506] border-teal-500 shadow-md font-bold'
                              : 'bg-[#141416] text-white/70 border-white/10 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {g === 'Male' && t('auth.reg.genderMale')}
                          {g === 'Female' && t('auth.reg.genderFemale')}
                          {g === 'Other' && t('auth.reg.genderOther')}
                          {g === 'Prefer not to say' && t('auth.reg.genderPreferNot')}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    {t('auth.reg.address')} *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5" />
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
                      }}
                      placeholder={t('auth.reg.addressPlaceholder')}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:ring-1 transition-all bg-[#141416] text-white ${
                        errors.address
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/40'
                          : 'border-white/10 focus:border-teal-500 focus:ring-teal-500/40 placeholder-white/30'
                      }`}
                    />
                  </div>
                  {errors.address && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.address}</span>
                    </p>
                  )}
                </div>

                {/* Email Address (Optional) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    {t('auth.reg.email')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                      }}
                      placeholder={t('auth.reg.emailPlaceholder')}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:ring-1 transition-all bg-[#141416] text-white ${
                        errors.email
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/40'
                          : 'border-white/10 focus:border-teal-500 focus:ring-teal-500/40 placeholder-white/30'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/80 font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('auth.reg.back')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) {
                      setCurrentStep(3);
                    }
                  }}
                  className="flex-1 py-3 rounded-xl bg-teal-500 text-[#050506] font-bold hover:bg-teal-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-950/40 text-sm cursor-pointer"
                >
                  <span>{t('auth.reg.continue')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: HEALTH & EMERGENCY DETAILS */}
          {/* ============================================================ */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-3">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {t('auth.reg.healthTitle')}
                </h1>
                <p className="text-sm text-white/60 mt-1">
                  {t('auth.reg.healthSubtitle')}
                </p>
              </div>

              {/* SECTION 1: Blood Group */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  {t('auth.reg.bloodGroup')} *
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroupType[]).map(
                    (bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setBloodGroup(bg)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                          bloodGroup === bg
                            ? 'bg-rose-600 text-white border-rose-500 shadow-md font-bold'
                            : 'bg-[#141416] text-white/70 border-white/10 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {bg}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* SECTION 2: Emergency Contact */}
              <div className="space-y-4 pt-2">
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <span>{t('auth.reg.emergencyContact')}</span>
                  </h3>
                  <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/60 text-blue-300 text-xs flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span>{t('auth.reg.emergencyNote')}</span>
                  </div>
                </div>

                {/* Emergency Contact Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    {t('auth.reg.emergencyName')} *
                  </label>
                  <input
                    type="text"
                    value={emergencyName}
                    onChange={(e) => {
                      setEmergencyName(e.target.value);
                      if (errors.emergencyName) setErrors((prev) => ({ ...prev, emergencyName: '' }));
                    }}
                    placeholder={t('auth.reg.emergencyNamePlaceholder')}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-1 transition-all bg-[#141416] text-white ${
                      errors.emergencyName
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/40'
                        : 'border-white/10 focus:border-teal-500 focus:ring-teal-500/40 placeholder-white/30'
                    }`}
                  />
                  {errors.emergencyName && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.emergencyName}</span>
                    </p>
                  )}
                </div>

                {/* Relationship & Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                      {t('auth.reg.relationship')} *
                    </label>
                    <select
                      value={emergencyRelationship}
                      onChange={(e) =>
                        setEmergencyRelationship(e.target.value as RelationshipType)
                      }
                      className="w-full px-4 py-3 rounded-xl border border-white/10 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 bg-[#141416] text-white"
                    >
                      <option value="Parent">Parent</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Child">Child</option>
                      <option value="Relative">Relative</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                      {t('auth.reg.emergencyMobile')} *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        maxLength={10}
                        value={emergencyMobile}
                        onChange={(e) => {
                          setEmergencyMobile(e.target.value.replace(/\D/g, ''));
                          if (errors.emergencyMobile)
                            setErrors((prev) => ({ ...prev, emergencyMobile: '' }));
                        }}
                        placeholder={t('auth.reg.emergencyMobilePlaceholder')}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:ring-1 transition-all bg-[#141416] text-white ${
                          errors.emergencyMobile
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/40'
                            : 'border-white/10 focus:border-teal-500 focus:ring-teal-500/40 placeholder-white/30'
                        }`}
                      />
                    </div>
                    {errors.emergencyMobile && (
                      <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{errors.emergencyMobile}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Emergency Email (Optional) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    {t('auth.reg.emergencyEmail')}
                  </label>
                  <input
                    type="email"
                    value={emergencyEmail}
                    onChange={(e) => {
                      setEmergencyEmail(e.target.value);
                      if (errors.emergencyEmail) setErrors((prev) => ({ ...prev, emergencyEmail: '' }));
                    }}
                    placeholder="e.g. contact@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 bg-[#141416] text-white placeholder-white/30"
                  />
                  {errors.emergencyEmail && (
                    <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.emergencyEmail}</span>
                    </p>
                  )}
                </div>

                {/* Emergency Address (Optional) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    {t('auth.reg.emergencyAddress')}
                  </label>
                  <input
                    type="text"
                    value={emergencyAddress}
                    onChange={(e) => setEmergencyAddress(e.target.value)}
                    placeholder="Residential address or 'Same as patient'"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 bg-[#141416] text-white placeholder-white/30"
                  />
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/80 font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('auth.reg.back')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep3()) {
                      setCurrentStep(4);
                    }
                  }}
                  className="flex-1 py-3 rounded-xl bg-teal-500 text-[#050506] font-bold hover:bg-teal-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-950/40 text-sm cursor-pointer"
                >
                  <span>{t('auth.reg.continue')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: IDENTITY & HEALTH ID VERIFICATION */}
          {/* ============================================================ */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-3">
                  <Shield className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {t('auth.reg.identityTitle')}
                </h1>
                <p className="text-sm text-white/60 mt-1">
                  {t('auth.reg.identitySubtitle')}
                </p>
              </div>

              {/* SECTION 1: Aadhaar Number */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                    {t('auth.reg.aadhaar')} *
                  </label>
                  <span className="text-[11px] text-teal-300 font-semibold bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800">
                    12 Digits
                  </span>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showAadhaar ? 'text' : 'password'}
                    maxLength={12}
                    value={aadhaarInput}
                    onChange={(e) => {
                      setAadhaarInput(e.target.value.replace(/\D/g, ''));
                      if (errors.aadhaar) setErrors((prev) => ({ ...prev, aadhaar: '' }));
                    }}
                    placeholder={t('auth.reg.aadhaarPlaceholder')}
                    className={`w-full pl-10 pr-12 py-3 rounded-xl border text-sm font-mono tracking-wider focus:ring-1 transition-all bg-[#141416] text-white ${
                      errors.aadhaar
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/40'
                        : 'border-white/10 focus:border-teal-500 focus:ring-teal-500/40 placeholder-white/30'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAadhaar(!showAadhaar)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1 cursor-pointer"
                  >
                    {showAadhaar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.aadhaar && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.aadhaar}</span>
                  </p>
                )}

                {/* Privacy & Security Notice */}
                <div className="p-3 rounded-xl bg-[#141416] border border-white/10 text-white/60 text-xs flex items-start gap-2">
                  <Shield className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                  <span>{t('auth.reg.aadhaarSecurity')}</span>
                </div>
              </div>

              {/* SECTION 2: ABHA ID (Mandatory) */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                    {t('auth.reg.abhaId')} *
                  </label>
                  <span className="text-[11px] text-teal-300 font-semibold bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800">
                    14 Digits (Mandatory)
                  </span>
                </div>
                <input
                  type="text"
                  value={abhaId}
                  onChange={(e) => {
                    setAbhaId(e.target.value);
                    if (errors.abha) setErrors((prev) => ({ ...prev, abha: '' }));
                  }}
                  placeholder="12-3456-7890-1234"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-1 transition-all font-medium bg-[#141416] text-white ${
                    errors.abha
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/40'
                      : 'border-white/10 focus:border-teal-500 focus:ring-teal-500/40 placeholder-white/30'
                  }`}
                />
                {errors.abha && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.abha}</span>
                  </p>
                )}
                <p className="text-[11px] text-white/50">
                  Enter your Ayushman Bharat Health Account (ABHA) number for integrated national health records.
                </p>
              </div>

              {/* Confirmation Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={identityConfirmed}
                    onChange={(e) => {
                      setIdentityConfirmed(e.target.checked);
                      if (errors.consent) setErrors((prev) => ({ ...prev, consent: '' }));
                    }}
                    className="mt-1 w-4 h-4 rounded text-teal-500 focus:ring-teal-500/40 bg-[#141416] border-white/20"
                  />
                  <span className="text-xs text-white/70 font-medium leading-relaxed">
                    {t('auth.reg.identityConfirm')}
                  </span>
                </label>
                {errors.consent && (
                  <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors.consent}</span>
                  </p>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/80 font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('auth.reg.back')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRegister}
                  className="flex-1 py-3.5 rounded-xl bg-teal-500 text-[#050506] font-bold hover:bg-teal-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-950/40 text-sm cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  <span>{t('auth.reg.register')}</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 5: REGISTRATION PROCESSING ANIMATION */}
          {/* ============================================================ */}
          {currentStep === 5 && (
            <div className="py-12 px-4 text-center space-y-8">
              <div className="relative mx-auto w-20 h-20">
                <div className="w-20 h-20 rounded-full border-4 border-teal-500/20 border-t-teal-400 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-teal-400" />
                </div>
              </div>

              <div className="space-y-4 max-w-sm mx-auto">
                <div
                  className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                    processingStage >= 1
                      ? 'bg-teal-950/60 border-teal-800 text-teal-200 font-semibold'
                      : 'bg-[#141416] border-white/10 text-white/40'
                  }`}
                >
                  {processingStage > 1 ? (
                    <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
                  ) : (
                    <RefreshCw className="w-5 h-5 text-teal-400 animate-spin flex-shrink-0" />
                  )}
                  <span className="text-xs">{t('auth.reg.processing1')}</span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                    processingStage >= 2
                      ? 'bg-teal-950/60 border-teal-800 text-teal-200 font-semibold'
                      : 'bg-[#141416] border-white/10 text-white/40'
                  }`}
                >
                  {processingStage > 2 ? (
                    <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0" />
                  ) : processingStage === 2 ? (
                    <RefreshCw className="w-5 h-5 text-teal-400 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0" />
                  )}
                  <span className="text-xs">{t('auth.reg.processing2')}</span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                    processingStage >= 3
                      ? 'bg-teal-950/60 border-teal-800 text-teal-200 font-semibold'
                      : 'bg-[#141416] border-white/10 text-white/40'
                  }`}
                >
                  {processingStage === 3 ? (
                    <RefreshCw className="w-5 h-5 text-teal-400 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0" />
                  )}
                  <span className="text-xs">{t('auth.reg.processing3')}</span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 6: REGISTRATION SUCCESS */}
          {/* ============================================================ */}
          {currentStep === 6 && registeredPatient && (
            <div className="space-y-6 text-center">
              {/* Success Badge */}
              <div className="w-16 h-16 rounded-3xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center mx-auto shadow-lg shadow-teal-950/40">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  {t('auth.reg.successTitle')}
                </h1>
                <p className="text-sm text-white/60 mt-1">
                  {t('auth.reg.welcome')}, <strong className="text-white">{registeredPatient.fullName}</strong>!
                </p>
              </div>

              {/* Healthcare ID Display Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-950/60 to-[#101926] border border-teal-500/30 shadow-xl text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  {t('auth.reg.yourHealthId')}
                </p>
                <div className="mt-2 text-3xl font-black text-teal-200 font-mono tracking-wider select-all">
                  {registeredPatient.healthcareId}
                </div>
                <p className="text-xs text-white/60 mt-2 max-w-md mx-auto">
                  {t('auth.reg.loginHint')}
                </p>
                <button
                  type="button"
                  onClick={handleCopyHealthId}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#0B0B0D] text-teal-300 text-xs font-bold hover:bg-white/5 transition-colors border border-teal-500/30 shadow-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-400" />
                      <span>{t('auth.reg.healthIdCopied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-teal-400" />
                      <span>{t('auth.reg.copyHealthId')}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Registered Profile Summary */}
              <div className="bg-[#141416] p-4 rounded-2xl border border-white/10 text-left text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-white/50">Full Name</span>
                  <span className="font-semibold text-white">{registeredPatient.fullName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-white/50">Registered Mobile</span>
                  <span className="font-semibold text-white">+91 {registeredPatient.mobileNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-white/50">Date of Birth & Age</span>
                  <span className="font-semibold text-white">
                    {registeredPatient.dateOfBirth} ({registeredPatient.age} yrs)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-white/50">Blood Group</span>
                  <span className="font-semibold text-rose-400">{registeredPatient.bloodGroup}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/10">
                  <span className="text-white/50">Identity Verification</span>
                  <span className="font-mono text-white/80">{registeredPatient.maskedAadhaar}</span>
                </div>
                {registeredPatient.abhaId && (
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-white/50">ABHA ID</span>
                    <span className="font-mono text-white/80">{registeredPatient.abhaId}</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-white/50">Emergency Contact</span>
                  <span className="font-semibold text-white">
                    {registeredPatient.emergencyContact.fullName} ({registeredPatient.emergencyContact.relationship})
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleContinueToLogin}
                  className="flex-1 py-3.5 rounded-xl border border-teal-500/40 text-teal-400 font-bold hover:bg-teal-500/10 transition-colors text-sm cursor-pointer"
                >
                  {t('auth.reg.continueToLogin')}
                </button>
                <button
                  type="button"
                  onClick={handleGoToPatientHome}
                  className="flex-1 py-3.5 rounded-xl bg-teal-500 text-[#050506] font-bold hover:bg-teal-400 transition-colors shadow-lg shadow-teal-950/40 flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{t('auth.reg.goToPatientHome')}</span>
                </button>
              </div>
            </div>
          )}
        </ScrollReveal>
      </main>
    </div>
  );
};
