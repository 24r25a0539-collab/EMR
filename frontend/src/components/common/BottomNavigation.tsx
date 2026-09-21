import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Pill, Bell, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotifications } from '../../contexts/NotificationContext';

interface BottomNavigationProps {
  unreadAlertsCount?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ unreadAlertsCount }) => {
  const { role, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const { unreadCount } = useNotifications();

  if (!isAuthenticated || role !== 'PATIENT') {
    return null;
  }

  const effectiveCount = typeof unreadAlertsCount === 'number' ? unreadAlertsCount : unreadCount;

  const navItems = [
    { to: '/patient/home', label: t('nav.home', 'Home'), icon: Home },
    { to: '/patient/appointments', label: t('nav.appointments', 'Appointments'), icon: Calendar },
    { to: '/patient/medicines', label: t('nav.medicines', 'Medicines'), icon: Pill },
    {
      to: '/patient/notifications',
      label: t('nav.notifications', 'Alerts'),
      icon: Bell,
      badge: effectiveCount > 0 ? effectiveCount : undefined,
    },
    { to: '/patient/profile', label: t('nav.profile', 'Profile'), icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0B0B0D]/95 backdrop-blur-md border-t border-white/[0.08] shadow-2xl select-none pb-safe transition-colors">
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center relative py-1 px-1 transition-colors ${
                  isActive
                    ? 'text-blue-400 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                    {item.badge !== undefined && (
                      <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-rose-600 text-[10px] font-bold text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] mt-1 tracking-tight truncate w-full text-center">
                    {item.label}
                  </span>
                  {isActive && (
                    <span className="absolute top-0 w-8 h-0.5 bg-blue-500 rounded-full shadow-sm shadow-blue-500" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
