import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Header } from '../common/Header';
import { Sidebar } from '../common/Sidebar';
import { MobileDrawer } from '../common/MobileDrawer';
import { BottomNavigation } from '../common/BottomNavigation';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ChevronRight, Home } from 'lucide-react';

export const AuthenticatedLayout: React.FC = () => {
  const { role } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Collapsible sidebar state (persisted)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('emr_sidebar_collapsed') === 'true';
  });

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('emr_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Close mobile drawer on route changes and reset scroll position to top
  useEffect(() => {
    setMobileDrawerOpen(false);
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname, location.hash]);

  // Generate breadcrumb trail based on current path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const homeUrl = role === 'PATIENT' ? '/patient/home' : role === 'DOCTOR' ? '/doctor/dashboard' : '/admin/dashboard';

  const formatBreadcrumb = (part: string) => {
    const raw = part
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return t(`breadcrumb.${part}`, t(`nav.${part}`, raw));
  };

  return (
    <div className="min-h-screen bg-[#060709] text-[#F5F5F5] flex flex-col antialiased">
      {/* Top Header */}
      <Header onOpenMobileMenu={() => setMobileDrawerOpen(true)} />

      {/* Main Body: Sidebar + Scrollable Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Desktop Left Sidebar */}
        <Sidebar collapsed={collapsed} onToggleCollapse={handleToggleCollapse} />

        {/* Mobile Navigation Drawer */}
        <MobileDrawer isOpen={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

        {/* Primary Content Area */}
        <main ref={mainRef} className="flex-1 overflow-y-auto flex flex-col focus:outline-hidden pb-20 lg:pb-10 bg-[#060709]">
          {/* Breadcrumb Bar on Desktop */}
          {pathParts.length > 1 && (
            <div className="hidden sm:block border-b border-white/[0.08] bg-[#0B0B0D]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-2.5">
              <nav className="flex items-center text-xs text-slate-400 font-medium">
                <Link
                  to={homeUrl}
                  className="flex items-center gap-1.5 hover:text-blue-400 transition-colors"
                >
                  <Home className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t('breadcrumb.portal', 'Portal')}</span>
                </Link>

                {pathParts.map((part, idx) => {
                  const url = '/' + pathParts.slice(0, idx + 1).join('/');
                  const isLast = idx === pathParts.length - 1;
                  return (
                    <React.Fragment key={url}>
                      <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-600 flex-shrink-0" />
                      {isLast ? (
                        <span className="text-white font-bold truncate max-w-xs">
                          {formatBreadcrumb(part)}
                        </span>
                      ) : (
                        <Link
                          to={url}
                          className="hover:text-blue-400 transition-colors truncate max-w-xs text-slate-400"
                        >
                          {formatBreadcrumb(part)}
                        </Link>
                      )}
                    </React.Fragment>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Child Route Content with Page Transition */}
          <div className="flex-1 page-transition">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Persistent Mobile Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};
