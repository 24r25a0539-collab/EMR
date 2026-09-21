import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CreditCard,
  AtSign,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Header } from '../../components/common/Header';
import { api } from '../../services/api';
import { ScrollReveal } from '../../components/common/ScrollReveal';

type LoginMethod = 'HEALTHCARE_ID' | 'MOBILE' | 'ABHA_ID';

interface MatchedPatientInfo {
  fullName: string;
  healthId: string;
  maskedMobile: string;
}

export const PatientLoginPage: React.FC = () => {
  const { t } = useLanguage();
  const { loginPatient } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Active Login Method Tab
  const [activeMethod, setActiveMethod] = useState<LoginMethod>('HEALTHCARE_ID');

  // Identifier input per tab
  const [healthcareIdInput, setHealthcareIdInput] = useState<string>('');
  const [mobileInput, setMobileInput] = useState<string>('');
  const [abhaIdInput, setAbhaIdInput] = useState<string>('');

  // Flow step: IDENTIFIER -> OTP
  const [step, setStep] = useState<'IDENTIFIER' | 'OTP'>('IDENTIFIER');
  const [matchedInfo, setMatchedInfo] = useState<MatchedPatientInfo | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string>('');

  // OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'OTP' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Current Identifier based on active tab
  const getCurrentIdentifier = (): string => {
    switch (activeMethod) {
      case 'HEALTHCARE_ID':
        return healthcareIdInput.trim();
      case 'MOBILE':
        return mobileInput.trim();
      case 'ABHA_ID':
        return abhaIdInput.trim();
    }
  };

  // Handle Tab Switch
  const handleTabChange = (method: LoginMethod) => {
    if (step === 'OTP') {
      setStep('IDENTIFIER');
    }
    setActiveMethod(method);
    setErrorMessage('');
  };

  // Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = getCurrentIdentifier();

    if (!identifier) {
      if (activeMethod === 'HEALTHCARE_ID') {
        setErrorMessage('Please enter your Healthcare ID (e.g. HP-100246).');
      } else if (activeMethod === 'MOBILE') {
        setErrorMessage('Please enter your 10-digit registered mobile number.');
      } else {
        setErrorMessage('Please enter your ABHA ID (e.g. rahul@abdm).');
      }
      return;
    }

    // UX Validation
    if (activeMethod === 'HEALTHCARE_ID' && !/^HP-\d{6}$/i.test(identifier)) {
      setErrorMessage('Please enter a valid Healthcare ID format (e.g. HP-100246).');
      return;
    }

    if (activeMethod === 'MOBILE') {
      const digits = identifier.replace(/\D/g, '');
      if (digits.length < 10) {
        setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // Dispatch OTP request to PostgreSQL Backend
      const res = await api.patientRequestOtp(identifier);

      if (res && res.success) {
        setMatchedInfo({
          fullName: res.patientName || 'Patient',
          healthId: res.healthId || identifier,
          maskedMobile: res.maskedMobile || identifier,
        });
        setDevOtpHint(res.devOtpHint || '');
        setStep('OTP');
        setTimer(30);
        setOtpDigits(['', '', '', '', '', '']);

        const maskedPhone = res.maskedMobile || identifier;
        addToast('info', `${t('auth.login.enterOtpMsg')} (${maskedPhone})`);
        setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
      } else {
        throw new Error(res?.message || res?.error || 'Failed to dispatch verification code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'No matching patient account found. Please check your details or sign up.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP digit change
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpDigits];
    newOtp[index] = value.slice(-1);
    setOtpDigits(newOtp);

    // Auto-advance
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const digits = pastedData.split('');
      const newOtp = [...otpDigits];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtpDigits(newOtp);
      otpInputsRef.current[Math.min(digits.length, 5)]?.focus();
    }
  };

  // Handle Verify OTP & Login
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otpDigits.join('');

    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const identifier = getCurrentIdentifier();
      const res = await api.patientVerifyOtp(identifier, fullOtp);

      if (!res || !res.success || !res.token || !res.user) {
        throw new Error(res?.message || res?.error || 'Authentication failed.');
      }

      // Login Patient via AuthContext with real JWT and PostgreSQL User
      loginPatient(res.token, res.user);

      const patientDisplayName = res.user.name || res.user.patient?.fullName || 'Patient';
      addToast('success', `Welcome back, ${patientDisplayName}!`);
      navigate('/patient/home');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get active identifier label & placeholder
  const getFieldInfo = () => {
    switch (activeMethod) {
      case 'HEALTHCARE_ID':
        return {
          label: t('auth.login.healthIdLabel'),
          placeholder: t('auth.login.healthIdPlaceholder'),
          icon: <CreditCard className="w-5 h-5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />,
          value: healthcareIdInput,
          setter: setHealthcareIdInput,
        };
      case 'MOBILE':
        return {
          label: t('auth.login.mobileLabel'),
          placeholder: t('auth.login.mobilePlaceholder'),
          icon: <Smartphone className="w-5 h-5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />,
          value: mobileInput,
          setter: setMobileInput,
        };
      case 'ABHA_ID':
        return {
          label: t('auth.login.abhaLabel'),
          placeholder: t('auth.login.abhaPlaceholder'),
          icon: <AtSign className="w-5 h-5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />,
          value: abhaIdInput,
          setter: setAbhaIdInput,
        };
    }
  };

  const fieldInfo = getFieldInfo();

  return (
    <div className="min-h-screen bg-[#050506] text-white flex flex-col antialiased relative overflow-hidden selection:bg-teal-500/20 selection:text-teal-300">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-br from-teal-500/15 via-blue-600/10 to-transparent rounded-full filter blur-[100px] pointer-events-none" />

      <Header />

      <main className="flex-1 max-w-md mx-auto w-full px-4 sm:px-6 py-10 sm:py-14 flex flex-col justify-center relative z-10">
        <ScrollReveal direction="up">
          {/* Login Container */}
          <div className="bg-[#0B0B0D] p-6 sm:p-8 rounded-[30px] shadow-2xl border border-white/10 hover:border-teal-500/40 transition-all">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-950/40">
                <User className="w-7 h-7" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {t('auth.login.patientTitle')}
              </h1>
              <p className="text-xs text-white/60 mt-1">
                {t('auth.login.patientSubtitle')}
              </p>
            </div>

            {/* 3-Method Tabs Toggle */}
            {step === 'IDENTIFIER' && (
              <div className="mb-6 p-1 bg-[#141416] rounded-2xl flex gap-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => handleTabChange('HEALTHCARE_ID')}
                  className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeMethod === 'HEALTHCARE_ID'
                      ? 'bg-teal-500 text-[#050506] shadow-md font-bold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {t('auth.login.methodHealthId')}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('MOBILE')}
                  className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeMethod === 'MOBILE'
                      ? 'bg-teal-500 text-[#050506] shadow-md font-bold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {t('auth.login.methodMobile')}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('ABHA_ID')}
                  className={`flex-1 py-2 px-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeMethod === 'ABHA_ID'
                      ? 'bg-teal-500 text-[#050506] shadow-md font-bold'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {t('auth.login.methodAbha')}
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {step === 'IDENTIFIER' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    {fieldInfo.label} *
                  </label>
                  <div className="relative">
                    {fieldInfo.icon}
                    <input
                      type="text"
                      value={fieldInfo.value}
                      onChange={(e) => {
                        fieldInfo.setter(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder={fieldInfo.placeholder}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-[#141416] text-sm text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 placeholder-white/30 transition-all font-medium"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-white/40 mt-1.5">
                    We will send a 6-digit verification code to your registered mobile.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#050506] font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-950/40 text-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{t('auth.login.sendOtp')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="p-3 bg-[#141416] rounded-xl border border-white/10 text-[11px] text-white/50 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <span>Protected by zero-knowledge patient authentication & SHA-256 verification.</span>
                </div>
              </form>
            ) : (
              /* STEP 2: OTP VERIFICATION */
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {/* Matched Patient Greeting */}
                {matchedInfo && (
                  <div className="p-3.5 bg-[#141416] rounded-2xl border border-teal-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-white">{matchedInfo.fullName}</p>
                        <p className="text-white/50 text-[11px] font-mono">
                          {matchedInfo.healthId} • {matchedInfo.maskedMobile}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep('IDENTIFIER')}
                      className="text-teal-400 font-bold hover:underline text-xs bg-[#0B0B0D] px-2.5 py-1 rounded-lg border border-white/10 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    6-Digit Verification Code
                  </label>
                  <div className="flex justify-between gap-2" onPaste={handlePaste}>
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
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-11 sm:w-12 h-13 sm:h-14 text-center text-xl font-bold rounded-xl border border-white/10 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/40 text-white bg-[#141416]"
                      />
                    ))}
                  </div>

                  {/* Development Mode Dynamic OTP Banner */}
                  {devOtpHint ? (
                    <div className="mt-3 p-2.5 rounded-xl bg-teal-950/40 border border-teal-800/60 text-xs text-teal-200 flex items-center justify-between">
                      <span className="font-semibold text-[11px]">Development Mode</span>
                      <strong className="font-mono text-sm tracking-widest bg-[#050506] px-2.5 py-0.5 rounded border border-teal-500/30 text-teal-300">
                        Demo OTP: {devOtpHint}
                      </strong>
                    </div>
                  ) : null}

                  <div className="mt-2.5 flex items-center justify-between text-xs text-white/50">
                    <span>Expires in 10 minutes</span>
                    {timer > 0 ? (
                      <span>Resend in {timer}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleSendOtp(e)}
                        className="text-teal-400 font-bold hover:underline cursor-pointer"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-teal-500 text-[#050506] font-bold hover:bg-teal-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-950/40 text-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t('auth.login.verifyAndLogin')}</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Registration link */}
            <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-white/50">
              <span>{t('auth.login.dontHaveAccount')} </span>
              <Link to="/patient/register" className="font-bold text-teal-400 hover:underline">
                {t('auth.login.registerNow')}
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </main>
    </div>
  );
};
