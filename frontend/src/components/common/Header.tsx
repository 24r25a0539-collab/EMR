import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Search,
  Bell,
  Globe,
  Menu,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Settings,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationDrawer } from './NotificationDrawer';
import { SearchOverlay } from './SearchOverlay';
import { ProfileAvatar } from './ProfileAvatar';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, role, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, languages, currentLanguageOption, t, localizeValue } = useLanguage();
  const { unreadCount, refreshNotifications } = useNotifications();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const getHomeRoute = () => {
    if (!isAuthenticated) return '/';
    if (role === 'PATIENT') return '/patient/home';
    if (role === 'DOCTOR') return '/doctor/dashboard';
    if (role === 'ADMIN') return '/admin/dashboard';
    return '/';
  };

  const getSearchPlaceholder = () => {
    const path = location.pathname.toLowerCase();
    if (path.startsWith('/admin') || (role === 'ADMIN' && path !== '/dashboard' && path !== '/')) {
      return t('search.placeholderAdminShort', 'Search admin modules, doctor verification...');
    }
    if (path.startsWith('/doctor') || (role === 'DOCTOR' && path !== '/dashboard' && path !== '/')) {
      return t('search.placeholderDoctorShort', 'Search clinical tools, access requests, authorized EMR...');
    }
    if (path.startsWith('/patient') || (role === 'PATIENT' && path !== '/dashboard' && path !== '/')) {
      return t('search.placeholderPatientShort', 'Search health records, prescriptions, appointments...');
    }
    return t('search.placeholderDashboardShort', 'Search application features, EMR modules, navigation...');
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#060709]/95 backdrop-blur-md border-b border-white/[0.08] shadow-2xl transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-4">
          {/* Left: Mobile menu toggle + Logo */}
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                type="button"
                onClick={onOpenMobileMenu}
                className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <Link to={getHomeRoute()} className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  Apex<span className="text-blue-400">EMR</span>
                </span>
                <span className="hidden sm:block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {t('app.networkBadge', 'National Sovereign Health Network')}
                </span>
              </div>
            </Link>
          </div>

          {/* Public Top Nav Links (When not logged in) */}
          {!isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <Link to="/#why-emr" className="hover:text-cyan-400 transition-colors">
                {t('nav.whyEmr', 'Why EMR?')}
              </Link>
              <Link to="/#how-it-works" className="hover:text-cyan-400 transition-colors">
                {t('nav.howItWorks', 'How It Works')}
              </Link>
              <Link to="/#security" className="hover:text-cyan-400 transition-colors">
                {t('nav.security', 'Security')}
              </Link>
              <Link to="/#emergency" className="hover:text-cyan-400 transition-colors">
                {t('nav.emergency', 'Emergency Care')}
              </Link>
            </nav>
          )}

          {/* Center Search Trigger (when logged in) */}
          {isAuthenticated && (
            <div className="flex-1 max-w-md hidden md:block">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-full flex items-center justify-between px-3.5 py-2 bg-[#101012] hover:bg-[#141416] text-slate-400 hover:text-slate-300 border border-white/[0.08] hover:border-white/[0.14] rounded-xl text-xs transition-all shadow-inner"
              >
                <span className="flex items-center gap-2 truncate">
                  <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="truncate">{getSearchPlaceholder()}</span>
                </span>
                <kbd className="px-1.5 py-0.5 text-[10px] bg-[#18181B] border border-white/[0.10] rounded text-slate-400 font-mono shadow-sm flex-shrink-0">
                  Ctrl K
                </kbd>
              </button>
            </div>
          )}

          {/* Right Action Icons: Language, Notifications, Profile (Theme Selector REMOVED) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Mobile Search Icon */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Language Selector Dropdown */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#101012] hover:bg-[#141416] border border-white/[0.08] hover:border-white/[0.14] rounded-xl transition-colors shadow-sm"
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">{currentLanguageOption.name}</span>
                <span className="sm:hidden">{currentLanguageOption.code.toUpperCase()}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[#101012] rounded-2xl shadow-2xl border border-white/[0.12] py-2 z-50 page-fade-in backdrop-blur-xl">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('header.selectLanguage', 'Select Language')}
                  </div>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left hover:bg-white/[0.06] transition-colors ${
                        language === lang.code
                          ? 'font-bold text-cyan-400 bg-cyan-500/10'
                          : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                      <span className="text-slate-500 font-normal">{lang.nativeName}</span>
                    </button>
                  ))}
                  <div className="border-t border-white/[0.08] mt-1 pt-1">
                    <Link
                      to="/choose-language"
                      onClick={() => setIsLangOpen(false)}
                      className="block px-3.5 py-1.5 text-[11px] text-center text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      {t('header.viewAllLanguages', 'View All Language Cards →')}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Bell */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setIsNotifOpen(true)}
                className="relative p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#060709]" />
                )}
              </button>
            )}

            {/* User Profile Menu OR Sign In / Register Buttons */}
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 rounded-xl bg-[#101012] hover:bg-[#141416] border border-white/[0.08] hover:border-white/[0.14] transition-colors"
                  aria-label="Open user menu"
                >
                  <ProfileAvatar
                    photoUrl={user?.profilePhoto || user?.patient?.profilePhoto || user?.doctor?.profilePhoto}
                    name={user?.patient?.fullName || user?.doctor?.fullName || user?.name}
                    role={role || 'PATIENT'}
                    size="sm"
                    shape="circle"
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-white leading-tight truncate max-w-[130px]">
                      {localizeValue(user?.patient?.fullName || user?.doctor?.fullName || user?.admin?.fullName || user?.name || 'User', 'personName')}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 capitalize">{role?.toLowerCase()}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#101012] rounded-2xl shadow-2xl border border-white/[0.12] py-2 z-50 page-fade-in backdrop-blur-xl">
                    {/* Header info */}
                    <div className="px-4 py-3 border-b border-white/[0.08] mb-1 flex items-center gap-3">
                      <ProfileAvatar
                        photoUrl={user?.profilePhoto || user?.patient?.profilePhoto || user?.doctor?.profilePhoto}
                        name={user?.patient?.fullName || user?.doctor?.fullName || user?.name}
                        role={role || 'PATIENT'}
                        size="md"
                        shape="rounded"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate">
                          {localizeValue(user?.patient?.fullName || user?.doctor?.fullName || user?.admin?.fullName || user?.name || '', 'personName')}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-slate-300 capitalize">
                            {role?.toLowerCase()}
                          </span>
                          {(user?.patient?.healthId || user?.healthId) && (
                            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 truncate">
                              {user?.patient?.healthId || user?.healthId}
                            </span>
                          )}
                          {role === 'DOCTOR' && (
                            <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20 truncate">
                              ID: {user?.doctor?.doctorIdNumber || user?.doctor?.registrationNumber || 'DOC'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <Link
                        to={role === 'DOCTOR' ? '/doctor/profile' : role === 'ADMIN' ? '/admin/security' : '/patient/profile'}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>{t('nav.profile', 'Profile')}</span>
                      </Link>

                      <Link
                        to={role === 'DOCTOR' ? '/doctor/settings' : '/patient/settings'}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span>{t('nav.settings', 'Settings')}</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setIsLangOpen(true);
                        }}
                        className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <Globe className="w-4 h-4 text-slate-400" />
                          <span>{t('nav.language', 'Language')}</span>
                        </div>
                        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {currentLanguageOption.name}
                        </span>
                      </button>

                      <Link
                        to={role === 'DOCTOR' ? '/doctor/audit' : role === 'ADMIN' ? '/admin/audit' : '/patient/security'}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white"
                      >
                        <Shield className="w-4 h-4 text-slate-400" />
                        <span>{t('nav.security', 'Security')}</span>
                      </Link>

                      {role === 'PATIENT' && (
                        <Link
                          to="/patient/access-permissions"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white"
                        >
                          <Lock className="w-4 h-4 text-slate-400" />
                          <span>{t('nav.permissions', 'Access & Privacy')}</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-white/[0.08] my-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('nav.logout', 'Sign Out')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-[#101012] border border-white/[0.08] rounded-xl hover:bg-white/[0.06] transition-colors"
                >
                  {t('nav.login', 'Sign In')}
                </Link>
                <Link
                  to="/patient/register"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/25 transition-colors"
                >
                  {t('nav.register', 'Get Started')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Drawers & Modals */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => {
          setIsNotifOpen(false);
          refreshNotifications();
        }}
      />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
