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

  const activeLink = 'flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-500/15 text-blue-400 font-bold border border-blue-500/30';
  const inactiveLink = 'flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06]';

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
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06]"
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
        <div className="flex-1 overflow-y-auto p-4 space-y-1 text-sm font-medium">
          {role === 'PATIENT' && (
            <>
              <NavLink
                to="/patient/home"
                onClick={onClose}
                className={({ isActive }) => (isActive ? activeLink : inactiveLink)}
              >
                <Home className="w-5 h-5" />
                <span>{t('nav.home', 'Home')}</span>
              </NavLink>

              <div className="pt-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
                {t('nav.myHealth', 'My Health')}
              </div>
              <NavLink
                to="/patient/medical-history"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/[0.06] text-xs"
              >
                <Heart className="w-4 h-4 text-cyan-400" />
                <span>{t('nav.medicalHistory', 'Medical History')}</span>
              </NavLink>
              <NavLink
                to="/patient/consultations"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/[0.06] text-xs"
              >
                <FileText className="w-4 h-4" />
                <span>{t('nav.consultations', 'Consultations')}</span>
              </NavLink>
              <NavLink
                to="/patient/prescriptions"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/[0.06] text-xs"
              >
                <Pill className="w-4 h-4" />
                <span>{t('nav.prescriptions', 'Prescriptions')}</span>
              </NavLink>
              <NavLink
                to="/patient/lab-reports"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/[0.06] text-xs"
              >
                <ClipboardList className="w-4 h-4" />
                <span>{t('nav.labReports', 'Lab Reports')}</span>
              </NavLink>
              <NavLink
                to="/patient/medicines"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/[0.06] text-xs"
              >
                <Clock className="w-4 h-4" />
                <span>{t('nav.medicines', 'Medicines & Reminders')}</span>
              </NavLink>

              <div className="pt-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
                {t('nav.findCare', 'Find Care')}
              </div>
              <NavLink
                to="/patient/appointments"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/[0.06] text-xs"
              >
                <Calendar className="w-4 h-4" />
                <span>{t('nav.appointments', 'Appointments')}</span>
              </NavLink>
              <NavLink
                to="/patient/doctors"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/[0.06] text-xs"
              >
                <Search className="w-4 h-4" />
                <span>{t('nav.doctors', 'Doctors')}</span>
              </NavLink>
              <NavLink
                to="/patient/hospitals"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/[0.06] text-xs"
              >
                <Building2 className="w-4 h-4" />
                <span>{t('nav.hospitals', 'Hospitals')}</span>
              </NavLink>

              <div className="pt-2 pb-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
                {t('nav.accessPrivacy', 'Access & Privacy')}
              </div>
              <NavLink
                to="/patient/access-permissions"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/[0.06] text-xs"
              >
                <Lock className="w-4 h-4" />
                <span>{t('nav.permissions', 'Permissions')}</span>
              </NavLink>
              <NavLink
                to="/patient/emergency"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-bold"
              >
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{t('nav.emergency', 'Emergency Care')}</span>
              </NavLink>
              <NavLink
                to="/patient/settings"
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-300 hover:bg-white/[0.06] text-xs"
              >
                <Settings className="w-4 h-4" />
                <span>{t('nav.settings', 'Settings')}</span>
              </NavLink>
            </>
          )}

          {role === 'DOCTOR' && (
            <>
              <NavLink to="/doctor/dashboard" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Home className="w-5 h-5" /> {t('doc.dashboard', 'Dashboard')}
              </NavLink>
              <NavLink to="/doctor/patients" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Users className="w-5 h-5" /> {t('doc.patients', 'Patient Directory')}
              </NavLink>
              <NavLink to="/doctor/current-patient" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <UserCheck className="w-5 h-5 text-teal-400" /> Current Patient
              </NavLink>
              <NavLink to="/doctor/access-requests" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Key className="w-5 h-5" /> {t('doc.requests', 'Access Requests')}
              </NavLink>
              <NavLink to="/doctor/appointments" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Calendar className="w-5 h-5" /> {t('nav.appointments', 'Appointments')}
              </NavLink>
              <NavLink to="/doctor/consultation/new" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Stethoscope className="w-5 h-5" /> {t('doc.consultations', 'Consultation Notes')}
              </NavLink>
              <NavLink to="/doctor/prescriptions" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Pill className="w-5 h-5" /> {t('doc.prescriptions', 'Prescriptions')}
              </NavLink>
              <NavLink to="/doctor/emergency" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 font-bold hover:bg-rose-500/10">
                <AlertCircle className="w-5 h-5" /> {t('doc.emergency', 'Emergency Triage')}
              </NavLink>
              <NavLink to="/doctor/settings" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Settings className="w-5 h-5" /> {t('nav.settings', 'Settings')}
              </NavLink>
            </>
          )}

          {role === 'ADMIN' && (
            <>
              <NavLink to="/admin/dashboard" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Home className="w-5 h-5" /> {t('doc.dashboard', 'Dashboard')}
              </NavLink>
              <NavLink to="/admin/doctors" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Award className="w-5 h-5" /> {t('nav.doctors', 'Doctors')}
              </NavLink>
              <NavLink to="/admin/hospitals" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Building2 className="w-5 h-5" /> {t('nav.hospitals', 'Hospitals')}
              </NavLink>
              <NavLink to="/admin/users" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Users className="w-5 h-5" /> User Directory
              </NavLink>
              <NavLink to="/admin/audit" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <ClipboardList className="w-5 h-5" /> {t('nav.audit', 'Audit Trail')}
              </NavLink>
              <NavLink to="/admin/blockchain" onClick={onClose} className={({ isActive }) => (isActive ? activeLink : inactiveLink)}>
                <Shield className="w-5 h-5" /> {t('nav.blockchainProof', 'Blockchain Proof')}
              </NavLink>
              <NavLink to="/admin/emergency" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 font-bold hover:bg-rose-500/10">
                <AlertCircle className="w-5 h-5" /> {t('nav.emergency', 'Emergency Care')}
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
            <LogOut className="w-5 h-5" />
            <span>{t('nav.logout', 'Sign Out')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
