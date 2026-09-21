import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
  Shield,
  Home,
  Heart,
  Calendar,
  Search,
  Lock,
  AlertCircle,
  Settings,
  LogOut,
  Pill,
  FileText,
  Building2,
  Users,
  Award,
  Stethoscope,
  ClipboardList,
  Key,
  Clock,
  UserCheck,
  Activity,
  HelpCircle,
  User,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ProfileAvatar } from './ProfileAvatar';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const { user, role, logout } = useAuth();
  const { t } = useLanguage();

  if (!isOpen) return null;

  const activeLink = 'flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-500/15 text-blue-400 font-bold border border-blue-500/30 shadow-lg shadow-blue-500/10';
  const inactiveLink = 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent transition-all';
  const activeSubLink = 'flex items-center gap-3 px-3 py-2 rounded-xl text-blue-400 font-bold bg-blue-500/10 border-l-2 border-blue-400 text-xs transition-colors';
  const inactiveSubLink = 'flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] text-xs transition-colors';

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex page-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-4/5 max-w-sm bg-[#0B0B0D] h-full shadow-2xl flex flex-col z-10 border-r border-white/[0.08] transition-colors">
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.08] bg-[#101012]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 flex items-center justify-center text-white shadow-md">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-black text-white">
              Apex<span className="text-blue-400">EMR</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 bg-[#101012] border-b border-white/[0.08] flex items-center gap-3">
          <ProfileAvatar
            photoUrl={user?.profilePhoto || user?.patient?.profilePhoto || user?.doctor?.profilePhoto}
            name={user?.patient?.fullName || user?.doctor?.fullName || user?.name}
            role={role || 'PATIENT'}
            size="md"
            shape="circle"
          />
          <div className="flex-1 truncate">
            <p className="text-sm font-bold text-white truncate">
              {user?.patient?.fullName || user?.doctor?.fullName || user?.admin?.fullName || user?.name || 'User'}
            </p>
            <p className="text-xs text-slate-400 capitalize">{role?.toLowerCase()}</p>
            {(user?.patient?.healthId || user?.healthId) && (
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                {user?.patient?.healthId || user?.healthId}
              </span>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 text-sm font-medium pb-12">
          {/* ================================= PATIENT MENU ================================= */}
          {role === 'PATIENT' && (
            <>
              {/* 1. Home */}
              <NavLink
                to="/patient/home"
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeLink : inactiveLink)}
              >
                <Home className="w-5 h-5 flex-shrink-0" />
                <span>{t('nav.home', 'Home')}</span>
              </NavLink>

              {/* 2. MY HEALTH */}
              <div className="pt-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
                {t('nav.myHealth', 'My Health')}
              </div>
              <NavLink
                to="/patient/medical-history"
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeSubLink : inactiveSubLink)}
              >
                <Heart className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>{t('nav.medicalHistory', 'Medical History')}</span>
              </NavLink>
              <NavLink
                to="/patient/consultations"
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeSubLink : inactiveSubLink)}
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span>{t('nav.consultations', 'Consultations')}</span>
              </NavLink>
              <NavLink
                to="/patient/prescriptions"
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeSubLink : inactiveSubLink)}
              >
                <Pill className="w-4 h-4 flex-shrink-0" />
                <span>{t('nav.prescriptions', 'Prescriptions')}</span>
              </NavLink>
              <NavLink
                to="/patient/lab-reports"
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeSubLink : inactiveSubLink)}
              >
                <ClipboardList className="w-4 h-4 flex-shrink-0" />
                <span>{t('nav.labReports', 'Lab Reports')}</span>
              </NavLink>
              <NavLink
                to="/patient/medicines"
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeSubLink : inactiveSubLink)}
              >
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{t('nav.medicines', 'Medicines & Reminders')}</span>
              </NavLink>

              {/* 3. FIND CARE */}
              <div className="pt-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
                {t('nav.findCare', 'Find Care')}
              </div>
              <NavLink
                to="/patient/appointments"
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeSubLink : inactiveSubLink)}
              >
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>{t('nav.appointments', 'Appointments')}</span>
              </NavLink>
              <NavLink
                to="/patient/doctors"
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeSubLink : inactiveSubLink)}
              >
                <Search className="w-4 h-4 flex-shrink-0 text-teal-400" />
                <span>{t('nav.doctors', 'Doctors')}</span>
              </NavLink>
              <NavLink
                to="/patient/hospitals"
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeSubLink : inactiveSubLink)}
              >
                <Building2 className="w-4 h-4 flex-shrink-0" />
                <span>{t('nav.hospitals', 'Hospitals')}</span>
              </NavLink>

              {/* 4. HEALTH ACTIVITY */}
              <div className="pt-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
                {t('nav.activity', 'Health Activity')}
              </div>
              <NavLink
                to="/patient/health-calendar"
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeSubLink : inactiveSubLink)}
              >
                <Calendar className="w-4 h-4 flex-shrink-0 text-blue-400" />
                <span>{t('nav.calendar', 'Health Calendar')}</span>
              </NavLink>
              <NavLink
                to="/patient/timeline"
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeSubLink : inactiveSubLink)}
              >
                <Activity className="w-4 h-4 flex-shrink-0 text-blue-400" />
                <span>{t('nav.timeline', 'Health Timeline')}</span>
              </NavLink>

              {/* 5. ACCESS & PRIVACY */}
              <div className="pt-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
                {t('nav.accessPrivacy', 'Access & Privacy')}
              </div>
              <NavLink
                to="/patient/access-permissions"
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeSubLink : inactiveSubLink)}
              >
                <Lock className="w-4 h-4 flex-shrink-0 text-purple-400" />
                <span>{t('nav.permissions', 'Permissions')}</span>
              </NavLink>
              <NavLink
                to="/patient/audit"
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeSubLink : inactiveSubLink)}
              >
                <ClipboardList className="w-4 h-4 flex-shrink-0 text-purple-400" />
                <span>{t('nav.audit', 'Audit Trail')}</span>
              </NavLink>
              <NavLink
                to="/patient/security"
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeSubLink : inactiveSubLink)}
              >
                <Key className="w-4 h-4 flex-shrink-0 text-purple-400" />
                <span>{t('nav.security', 'Security')}</span>
              </NavLink>
              <NavLink
                to="/patient/emergency"
                onClick={onClose}
                className={({ isActive }) =>
                  isActive
                    ? 'flex items-center gap-3 px-3 py-2 rounded-xl text-rose-400 font-bold bg-rose-500/15 border border-rose-500/30 text-xs shadow-lg shadow-rose-500/10'
                    : 'flex items-center gap-3 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-colors'
                }
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{t('nav.emergency', 'Emergency Care')}</span>
              </NavLink>

              {/* 6. SUPPORT */}
              <div className="pt-3 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
                {t('nav.support', 'Support')}
              </div>
              <NavLink
                to="/patient/helpdesk"
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeSubLink : inactiveSubLink)}
              >
                <HelpCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{t('nav.helpdesk', 'Help Desk')}</span>
              </NavLink>

              {/* 7. Settings */}
              <div className="pt-3 pb-1 border-t border-white/[0.06] mt-2">
                <NavLink
                  to="/patient/settings"
                  onClick={onClose}
                  className={({ isActive }) => (isActive ? activeLink : inactiveLink)}
                >
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  <span>{t('nav.settings', 'Settings')}</span>
                </NavLink>
              </div>
            </>
          )}

          {/* ================================= DOCTOR MENU ================================= */}
          {role === 'DOCTOR' && (
            <>
              <NavLink to="/doctor/dashboard" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Home className="w-5 h-5 flex-shrink-0" /> <span>{t('doc.dashboard', 'Dashboard')}</span>
              </NavLink>
              <NavLink to="/doctor/patients" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Users className="w-5 h-5 flex-shrink-0" /> <span>{t('doc.patients', 'Patient Directory')}</span>
              </NavLink>
              <NavLink to="/doctor/current-patient" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <UserCheck className="w-5 h-5 flex-shrink-0 text-teal-400" /> <span>Current Patient</span>
              </NavLink>
              <NavLink to="/doctor/access-requests" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Key className="w-5 h-5 flex-shrink-0" /> <span>{t('doc.requests', 'Access Requests')}</span>
              </NavLink>
              <NavLink to="/doctor/appointments" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Calendar className="w-5 h-5 flex-shrink-0" /> <span>{t('nav.appointments', 'Appointments')}</span>
              </NavLink>
              <NavLink to="/doctor/consultation/new" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Stethoscope className="w-5 h-5 flex-shrink-0" /> <span>{t('doc.consultations', 'Consultation Notes')}</span>
              </NavLink>
              <NavLink to="/doctor/prescriptions" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Pill className="w-5 h-5 flex-shrink-0" /> <span>{t('doc.prescriptions', 'Prescriptions')}</span>
              </NavLink>
              <NavLink to="/doctor/lab-reports" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <ClipboardList className="w-5 h-5 flex-shrink-0" /> <span>{t('nav.labReports', 'Lab Reports')}</span>
              </NavLink>
              <NavLink to="/doctor/emergency" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 font-bold hover:bg-rose-500/10 transition-colors">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" /> <span>{t('doc.emergency', 'Emergency Triage')}</span>
              </NavLink>
              <NavLink to="/doctor/audit" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Shield className="w-5 h-5 flex-shrink-0" /> <span>{t('nav.audit', 'Audit Trail')}</span>
              </NavLink>
              <NavLink to="/doctor/verification" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Award className="w-5 h-5 flex-shrink-0" /> <span>{t('doc.verification', 'Verification')}</span>
              </NavLink>
              <NavLink to="/doctor/profile" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <User className="w-5 h-5 flex-shrink-0" /> <span>{t('nav.profile', 'Profile')}</span>
              </NavLink>
              <NavLink to="/doctor/settings" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Settings className="w-5 h-5 flex-shrink-0" /> <span>{t('nav.settings', 'Settings')}</span>
              </NavLink>
            </>
          )}

          {/* ================================= ADMIN MENU ================================= */}
          {role === 'ADMIN' && (
            <>
              <NavLink to="/admin/dashboard" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Home className="w-5 h-5 flex-shrink-0" /> <span>{t('doc.dashboard', 'Dashboard')}</span>
              </NavLink>
              <NavLink to="/admin/doctors" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Award className="w-5 h-5 flex-shrink-0" /> <span>{t('nav.doctors', 'Doctors')}</span>
              </NavLink>
              <NavLink to="/admin/hospitals" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Building2 className="w-5 h-5 flex-shrink-0" /> <span>{t('nav.hospitals', 'Hospitals')}</span>
              </NavLink>
              <NavLink to="/admin/users" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Users className="w-5 h-5 flex-shrink-0" /> <span>User Directory</span>
              </NavLink>
              <NavLink to="/admin/audit" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <ClipboardList className="w-5 h-5 flex-shrink-0" /> <span>{t('nav.audit', 'Audit Trail')}</span>
              </NavLink>
              <NavLink to="/admin/security" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Key className="w-5 h-5 flex-shrink-0" /> <span>{t('nav.security', 'Security')}</span>
              </NavLink>
              <NavLink to="/admin/blockchain" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Shield className="w-5 h-5 flex-shrink-0" /> <span>{t('nav.blockchainProof', 'Blockchain Proof')}</span>
              </NavLink>
              <NavLink to="/admin/emergency" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 font-bold hover:bg-rose-500/10 transition-colors">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" /> <span>{t('nav.emergency', 'Emergency Care')}</span>
              </NavLink>
              <NavLink to="/admin/settings" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Settings className="w-5 h-5 flex-shrink-0" /> <span>{t('nav.settings', 'Settings')}</span>
              </NavLink>
            </>
          )}
        </div>

        {/* Footer Logout */}
        <div className="p-4 border-t border-white/[0.08] bg-[#101012]">
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-rose-400 font-semibold rounded-xl hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>{t('nav.logout', 'Sign Out')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
