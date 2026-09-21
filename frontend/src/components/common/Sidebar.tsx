import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Heart,
  Calendar,
  Lock,
  Bell,
  AlertCircle,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Pill,
  ClipboardList,
  Search,
  Building2,
  Users,
  Shield,
  Activity,
  Award,
  Stethoscope,
  Key,
  HelpCircle,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../contexts/NotificationContext';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { role, logout } = useAuth();
  const { t } = useLanguage();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    myHealth: true,
    findCare: false,
    activity: false,
    accessPrivacy: false,
  });

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isParentActive = (paths: string[]) => paths.some((p) => location.pathname.startsWith(p));

  const activeLinkClass = 'bg-blue-600/15 text-blue-400 font-bold border border-blue-500/30 shadow-lg shadow-blue-500/10';
  const inactiveLinkClass = 'text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent';
  const activeSubLinkClass = 'text-blue-400 font-bold bg-blue-500/10 border-l-2 border-blue-400';
  const inactiveSubLinkClass = 'text-slate-400 hover:text-white hover:bg-white/[0.04]';

  return (
    <aside
      className={`hidden lg:flex flex-col bg-[#0B0B0D] border-r border-white/[0.08] transition-all duration-300 z-20 select-none ${
        collapsed ? 'w-[76px]' : 'w-[250px]'
      }`}
    >
      {/* Top Header / Collapse Button */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-white/[0.08]">
        {!collapsed && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {role === 'PATIENT'
              ? t('nav.portalPatient', 'Patient Portal')
              : role === 'DOCTOR'
              ? t('nav.portalDoctor', 'Doctor Portal')
              : t('nav.portalAdmin', 'Admin Portal')}
          </span>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={`p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-xl transition-colors ${
            collapsed ? 'mx-auto' : ''
          }`}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 text-sm font-medium">
        {/* ================================= PATIENT MENU ================================= */}
        {role === 'PATIENT' && (
          <>
            {/* 1. Home */}
            <NavLink
              to="/patient/home"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('nav.home', 'Home') : undefined}
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('nav.home', 'Home')}</span>}
            </NavLink>

            {/* 2. My Health (Collapsible) */}
            <div>
              <button
                type="button"
                onClick={() => toggleSubmenu('myHealth')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all ${
                  isParentActive([
                    '/patient/medical-history',
                    '/patient/consultations',
                    '/patient/prescriptions',
                    '/patient/lab-reports',
                    '/patient/medicines',
                  ])
                    ? 'text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/20'
                    : inactiveLinkClass
                }`}
                title={collapsed ? t('nav.myHealth', 'My Health') : undefined}
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 flex-shrink-0 text-cyan-400" />
                  {!collapsed && <span>{t('nav.myHealth', 'My Health')}</span>}
                </div>
                {!collapsed && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openSubmenus.myHealth ? 'rotate-180 text-cyan-400' : 'text-slate-500'
                    }`}
                  />
                )}
              </button>

              {!collapsed && openSubmenus.myHealth && (
                <div className="ml-5 pl-3 border-l border-white/[0.10] space-y-1 mt-1">
                  <NavLink
                    to="/patient/medical-history"
                    className={({ isActive }) =>
                      `block px-3 py-1.5 rounded-xl text-xs transition-colors ${
                        isActive ? activeSubLinkClass : inactiveSubLinkClass
                      }`
                    }
                  >
                    {t('nav.medicalHistory', 'Medical History')}
                  </NavLink>
                  <NavLink
                    to="/patient/consultations"
                    className={({ isActive }) =>
                      `block px-3 py-1.5 rounded-xl text-xs transition-colors ${
                        isActive ? activeSubLinkClass : inactiveSubLinkClass
                      }`
                    }
                  >
                    {t('nav.consultations', 'Consultations')}
                  </NavLink>
                  <NavLink
                    to="/patient/prescriptions"
                    className={({ isActive }) =>
                      `block px-3 py-1.5 rounded-xl text-xs transition-colors ${
                        isActive ? activeSubLinkClass : inactiveSubLinkClass
                      }`
                    }
                  >
                    {t('nav.prescriptions', 'Prescriptions')}
                  </NavLink>
                  <NavLink
                    to="/patient/lab-reports"
                    className={({ isActive }) =>
                      `block px-3 py-1.5 rounded-xl text-xs transition-colors ${
                        isActive ? activeSubLinkClass : inactiveSubLinkClass
                      }`
                    }
                  >
                    {t('nav.labReports', 'Lab Reports')}
                  </NavLink>
                  <NavLink
                    to="/patient/medicines"
                    className={({ isActive }) =>
                      `block px-3 py-1.5 rounded-xl text-xs transition-colors ${
                        isActive ? activeSubLinkClass : inactiveSubLinkClass
                      }`
                    }
                  >
                    {t('nav.medicines', 'Medicines & Reminders')}
                  </NavLink>
                </div>
              )}
            </div>

            {/* 3. Appointments */}
            <NavLink
              to="/patient/appointments"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('nav.appointments', 'Appointments') : undefined}
            >
              <Calendar className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('nav.appointments', 'Appointments')}</span>}
            </NavLink>

            {/* 4. Find Care (Doctors / Hospitals) */}
            <div>
              <button
                type="button"
                onClick={() => toggleSubmenu('findCare')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all ${
                  isParentActive(['/patient/doctors', '/patient/hospitals'])
                    ? 'text-teal-400 font-bold bg-teal-500/10 border border-teal-500/20'
                    : inactiveLinkClass
                }`}
                title={collapsed ? t('nav.findCare', 'Find Care') : undefined}
              >
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 flex-shrink-0 text-teal-400" />
                  {!collapsed && <span>{t('nav.findCare', 'Find Care')}</span>}
                </div>
                {!collapsed && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openSubmenus.findCare ? 'rotate-180 text-teal-400' : 'text-slate-500'
                    }`}
                  />
                )}
              </button>

              {!collapsed && openSubmenus.findCare && (
                <div className="ml-5 pl-3 border-l border-white/[0.10] space-y-1 mt-1">
                  <NavLink
                    to="/patient/doctors"
                    className={({ isActive }) =>
                      `block px-3 py-1.5 rounded-xl text-xs transition-colors ${
                        isActive ? activeSubLinkClass : inactiveSubLinkClass
                      }`
                    }
                  >
                    {t('nav.doctors', 'Doctors')}
                  </NavLink>
                  <NavLink
                    to="/patient/hospitals"
                    className={({ isActive }) =>
                      `block px-3 py-1.5 rounded-xl text-xs transition-colors ${
                        isActive ? activeSubLinkClass : inactiveSubLinkClass
                      }`
                    }
                  >
                    {t('nav.hospitals', 'Hospitals')}
                  </NavLink>
                </div>
              )}
            </div>

            {/* 5. Health Activity (Calendar / Timeline) */}
            <div>
              <button
                type="button"
                onClick={() => toggleSubmenu('activity')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all ${
                  isParentActive(['/patient/health-calendar', '/patient/timeline'])
                    ? 'text-blue-400 font-bold bg-blue-500/10 border border-blue-500/20'
                    : inactiveLinkClass
                }`}
                title={collapsed ? t('nav.activity', 'Health Activity') : undefined}
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 flex-shrink-0 text-blue-400" />
                  {!collapsed && <span>{t('nav.activity', 'Health Activity')}</span>}
                </div>
                {!collapsed && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openSubmenus.activity ? 'rotate-180 text-blue-400' : 'text-slate-500'
                    }`}
                  />
                )}
              </button>

              {!collapsed && openSubmenus.activity && (
                <div className="ml-5 pl-3 border-l border-white/[0.10] space-y-1 mt-1">
                  <NavLink
                    to="/patient/health-calendar"
                    className={({ isActive }) =>
                      `block px-3 py-1.5 rounded-xl text-xs transition-colors ${
                        isActive ? activeSubLinkClass : inactiveSubLinkClass
                      }`
                    }
                  >
                    {t('nav.calendar', 'Health Calendar')}
                  </NavLink>
                  <NavLink
                    to="/patient/timeline"
                    className={({ isActive }) =>
                      `block px-3 py-1.5 rounded-xl text-xs transition-colors ${
                        isActive ? activeSubLinkClass : inactiveSubLinkClass
                      }`
                    }
                  >
                    {t('nav.timeline', 'Health Timeline')}
                  </NavLink>
                </div>
              )}
            </div>

            {/* 6. Access & Privacy */}
            <div>
              <button
                type="button"
                onClick={() => toggleSubmenu('accessPrivacy')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all ${
                  isParentActive([
                    '/patient/access-permissions',
                    '/patient/audit',
                    '/patient/security',
                    '/patient/correction-requests',
                  ])
                    ? 'text-purple-400 font-bold bg-purple-500/10 border border-purple-500/20'
                    : inactiveLinkClass
                }`}
                title={collapsed ? t('nav.accessPrivacy', 'Access & Privacy') : undefined}
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 flex-shrink-0 text-purple-400" />
                  {!collapsed && <span>{t('nav.accessPrivacy', 'Access & Privacy')}</span>}
                </div>
                {!collapsed && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      openSubmenus.accessPrivacy ? 'rotate-180 text-purple-400' : 'text-slate-500'
                    }`}
                  />
                )}
              </button>

              {!collapsed && openSubmenus.accessPrivacy && (
                <div className="ml-5 pl-3 border-l border-white/[0.10] space-y-1 mt-1">
                  <NavLink
                    to="/patient/access-permissions"
                    className={({ isActive }) =>
                      `block px-3 py-1.5 rounded-xl text-xs transition-colors ${
                        isActive ? activeSubLinkClass : inactiveSubLinkClass
                      }`
                    }
                  >
                    {t('nav.permissions', 'Permissions')}
                  </NavLink>
                  <NavLink
                    to="/patient/audit"
                    className={({ isActive }) =>
                      `block px-3 py-1.5 rounded-xl text-xs transition-colors ${
                        isActive ? activeSubLinkClass : inactiveSubLinkClass
                      }`
                    }
                  >
                    {t('nav.audit', 'Audit Trail')}
                  </NavLink>
                  <NavLink
                    to="/patient/security"
                    className={({ isActive }) =>
                      `block px-3 py-1.5 rounded-xl text-xs transition-colors ${
                        isActive ? activeSubLinkClass : inactiveSubLinkClass
                      }`
                    }
                  >
                    {t('nav.security', 'Security')}
                  </NavLink>
                </div>
              )}
            </div>

            {/* 7. Notifications */}
            <NavLink
              to="/patient/notifications"
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('nav.notifications', 'Notifications') : undefined}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{t('nav.notifications', 'Notifications')}</span>}
              </div>
              {!collapsed && unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                  {unreadCount}
                </span>
              )}
            </NavLink>

            {/* 8. Emergency Info */}
            <NavLink
              to="/patient/emergency"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-rose-500/15 text-rose-400 font-bold border border-rose-500/30 shadow-lg shadow-rose-500/10'
                    : 'text-rose-400 hover:bg-rose-500/10 border border-transparent'
                }`
              }
              title={collapsed ? t('nav.emergency', 'Emergency Care') : undefined}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              {!collapsed && <span>{t('nav.emergency', 'Emergency Care')}</span>}
            </NavLink>

            {/* 9. Profile */}
            <NavLink
              to="/patient/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('nav.profile', 'Profile') : undefined}
            >
              <User className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('nav.profile', 'Profile')}</span>}
            </NavLink>

            {/* 10. Settings */}
            <NavLink
              to="/patient/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('nav.settings', 'Settings') : undefined}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('nav.settings', 'Settings')}</span>}
            </NavLink>

            {/* 11. Helpdesk */}
            <NavLink
              to="/patient/helpdesk"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? 'Helpdesk' : undefined}
            >
              <HelpCircle className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>Helpdesk</span>}
            </NavLink>
          </>
        )}

        {/* ================================= DOCTOR MENU ================================= */}
        {role === 'DOCTOR' && (
          <>
            <NavLink
              to="/doctor/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('doc.dashboard', 'Dashboard') : undefined}
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('doc.dashboard', 'Dashboard')}</span>}
            </NavLink>

            <NavLink
              to="/doctor/patients"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('doc.patients', 'Patient Directory') : undefined}
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('doc.patients', 'Patient Directory')}</span>}
            </NavLink>

            <NavLink
              to="/doctor/current-patient"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive || location.pathname.startsWith('/doctor/current-patient')
                    ? 'bg-teal-500/15 text-teal-400 font-bold border border-teal-500/30 shadow-lg shadow-teal-500/10'
                    : inactiveLinkClass
                }`
              }
              title={collapsed ? 'Current Patient' : undefined}
            >
              <UserCheck className="w-5 h-5 flex-shrink-0 text-teal-400" />
              {!collapsed && <span>Current Patient</span>}
            </NavLink>

            <NavLink
              to="/doctor/access-requests"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('doc.requests', 'Access Requests') : undefined}
            >
              <Key className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('doc.requests', 'Access Requests')}</span>}
            </NavLink>

            <NavLink
              to="/doctor/appointments"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('nav.appointments', 'Appointments') : undefined}
            >
              <Calendar className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('nav.appointments', 'Appointments')}</span>}
            </NavLink>

            <NavLink
              to="/doctor/consultation/new"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? 'bg-teal-500/15 text-teal-400 font-bold border border-teal-500/30' : inactiveLinkClass
                }`
              }
              title={collapsed ? t('doc.consultations', 'Consultation Notes') : undefined}
            >
              <Stethoscope className="w-5 h-5 flex-shrink-0 text-teal-400" />
              {!collapsed && <span>{t('doc.consultations', 'Consultation Notes')}</span>}
            </NavLink>

            <NavLink
              to="/doctor/prescriptions"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? 'bg-purple-500/15 text-purple-400 font-bold border border-purple-500/30' : inactiveLinkClass
                }`
              }
              title={collapsed ? t('doc.prescriptions', 'Prescriptions') : undefined}
            >
              <Pill className="w-5 h-5 flex-shrink-0 text-purple-400" />
              {!collapsed && <span>{t('doc.prescriptions', 'Prescriptions')}</span>}
            </NavLink>

            <NavLink
              to="/doctor/lab-reports"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? 'bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/30' : inactiveLinkClass
                }`
              }
              title={collapsed ? t('nav.labReports', 'Lab Reports') : undefined}
            >
              <FileText className="w-5 h-5 flex-shrink-0 text-cyan-400" />
              {!collapsed && <span>{t('nav.labReports', 'Lab Reports')}</span>}
            </NavLink>

            <NavLink
              to="/doctor/emergency"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-rose-500/15 text-rose-400 font-bold border border-rose-500/30 shadow-lg shadow-rose-500/10'
                    : 'text-rose-400 hover:bg-rose-500/10 border border-transparent'
                }`
              }
              title={collapsed ? t('doc.emergency', 'Emergency Triage') : undefined}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              {!collapsed && <span>{t('doc.emergency', 'Emergency Triage')}</span>}
            </NavLink>

            <NavLink
              to="/doctor/audit"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('doc.audit', 'Security Audit') : undefined}
            >
              <ClipboardList className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('doc.audit', 'Security Audit')}</span>}
            </NavLink>

            <NavLink
              to="/doctor/profile"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('nav.profile', 'Profile') : undefined}
            >
              <User className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('nav.profile', 'Profile')}</span>}
            </NavLink>

            <NavLink
              to="/doctor/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('nav.settings', 'Settings') : undefined}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('nav.settings', 'Settings')}</span>}
            </NavLink>
          </>
        )}

        {/* ================================= ADMIN MENU ================================= */}
        {role === 'ADMIN' && (
          <>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('doc.dashboard', 'Dashboard') : undefined}
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('doc.dashboard', 'Dashboard')}</span>}
            </NavLink>

            <NavLink
              to="/admin/doctors"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('nav.doctors', 'Doctors') : undefined}
            >
              <Award className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('nav.doctors', 'Doctors')}</span>}
            </NavLink>

            <NavLink
              to="/admin/hospitals"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('nav.hospitals', 'Hospitals') : undefined}
            >
              <Building2 className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('nav.hospitals', 'Hospitals')}</span>}
            </NavLink>

            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? 'User Directory' : undefined}
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>User Directory</span>}
            </NavLink>

            <NavLink
              to="/admin/audit"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('nav.audit', 'Audit Trail') : undefined}
            >
              <ClipboardList className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('nav.audit', 'Audit Trail')}</span>}
            </NavLink>

            <NavLink
              to="/admin/security"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('nav.security', 'Security') : undefined}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('nav.security', 'Security')}</span>}
            </NavLink>

            <NavLink
              to="/admin/blockchain"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? 'bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/30' : inactiveLinkClass
                }`
              }
              title={collapsed ? t('nav.blockchainProof', 'Blockchain Proof') : undefined}
            >
              <Shield className="w-5 h-5 flex-shrink-0 text-cyan-400" />
              {!collapsed && <span>{t('nav.blockchainProof', 'Blockchain Proof')}</span>}
            </NavLink>

            <NavLink
              to="/admin/emergency"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive
                    ? 'bg-rose-500/15 text-rose-400 font-bold border border-rose-500/30 shadow-lg shadow-rose-500/10'
                    : 'text-rose-400 hover:bg-rose-500/10 border border-transparent'
                }`
              }
              title={collapsed ? t('nav.emergency', 'Emergency Care') : undefined}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              {!collapsed && <span>{t('nav.emergency', 'Emergency Care')}</span>}
            </NavLink>

            <NavLink
              to="/admin/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                  isActive ? activeLinkClass : inactiveLinkClass
                }`
              }
              title={collapsed ? t('nav.settings', 'Settings') : undefined}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{t('nav.settings', 'Settings')}</span>}
            </NavLink>
          </>
        )}
      </div>

      {/* Footer / Sign Out */}
      <div className="p-3 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-colors font-medium text-xs ${
            collapsed ? 'justify-center' : ''
          }`}
          title={t('nav.logout', 'Sign Out')}
          aria-label={t('nav.logout', 'Sign Out')}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>{t('nav.logout', 'Sign Out')}</span>}
        </button>
      </div>
    </aside>
  );
};
