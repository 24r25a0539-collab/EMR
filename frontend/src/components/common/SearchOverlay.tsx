import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  X,
  FileText,
  User,
  Building2,
  Pill,
  Calendar,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  Stethoscope,
  Shield,
  Lock,
  Activity,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category:
    | 'Application'
    | 'Feature'
    | 'Patient'
    | 'Doctor'
    | 'Hospital'
    | 'Appointment'
    | 'Medical Record'
    | 'Prescription'
    | 'Medicine'
    | 'Access & Privacy'
    | 'Security'
    | 'Emergency'
    | 'Help'
    | 'Navigation';
  path: string;
  keywords: string[];
}

type SearchContext = 'DASHBOARD' | 'PATIENT' | 'DOCTOR' | 'ADMIN';

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [dynamicItems, setDynamicItems] = useState<SearchResultItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { role, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  // Detect current search context based on route and role
  const context: SearchContext = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.startsWith('/admin') || (role === 'ADMIN' && path !== '/dashboard' && path !== '/')) {
      return 'ADMIN';
    }
    if (path.startsWith('/doctor') || (role === 'DOCTOR' && path !== '/dashboard' && path !== '/')) {
      return 'DOCTOR';
    }
    if (path.startsWith('/patient') || (role === 'PATIENT' && path !== '/dashboard' && path !== '/')) {
      return 'PATIENT';
    }
    return 'DASHBOARD';
  }, [location.pathname, role]);

  // Context-specific static application/module navigation & help items
  const baseItems: SearchResultItem[] = useMemo(() => {
    switch (context) {
      case 'PATIENT':
        return [
          {
            id: 'pat-nav-1',
            title: 'Patient Dashboard',
            subtitle: 'Overview of health metrics, recent vitals and quick actions',
            category: 'Navigation',
            path: '/patient/dashboard',
            keywords: ['dashboard', 'home', 'overview', 'vitals', 'metrics', 'summary'],
          },
          {
            id: 'pat-nav-2',
            title: 'My Medical Records',
            subtitle: 'Complete medical history, past diagnoses and clinical records',
            category: 'Medical Record',
            path: '/patient/records',
            keywords: ['records', 'medical records', 'history', 'health record', 'documents', 'my records'],
          },
          {
            id: 'pat-nav-3',
            title: 'My Prescriptions',
            subtitle: 'Active and past e-prescriptions issued by consulting doctors',
            category: 'Prescription',
            path: '/patient/prescriptions',
            keywords: ['prescription', 'prescriptions', 'medication', 'rx', 'drugs', 'medicines'],
          },
          {
            id: 'pat-nav-4',
            title: 'My Lab Reports',
            subtitle: 'Diagnostic lab findings, pathology tests and biochemistry reports',
            category: 'Medical Record',
            path: '/patient/lab-reports',
            keywords: ['lab', 'lab reports', 'tests', 'diagnostics', 'blood test', 'pathology', 'biochemistry'],
          },
          {
            id: 'pat-nav-5',
            title: 'Medicines & Refill Reminders',
            subtitle: 'Daily medication schedules, adherence tracking and refill alerts',
            category: 'Medicine',
            path: '/patient/medicines',
            keywords: ['medicine', 'medicines', 'reminders', 'adherence', 'schedule', 'pills', 'refill'],
          },
          {
            id: 'pat-nav-6',
            title: 'My Appointments',
            subtitle: 'Manage upcoming doctor visits and consultation bookings',
            category: 'Appointment',
            path: '/patient/appointments',
            keywords: ['appointment', 'appointments', 'doctor visit', 'schedule', 'booking'],
          },
          {
            id: 'pat-nav-7',
            title: 'Consultation History',
            subtitle: 'Review clinical consultation summaries and doctor advice notes',
            category: 'Medical Record',
            path: '/patient/consultations',
            keywords: ['consultation', 'consultations', 'doctor notes', 'advice', 'summary'],
          },
          {
            id: 'pat-nav-8',
            title: 'Find Doctors',
            subtitle: 'Browse accredited clinical specialists and verified practitioners',
            category: 'Doctor',
            path: '/patient/doctors',
            keywords: ['doctor', 'doctors', 'specialist', 'find doctor', 'physician', 'cardiologist'],
          },
          {
            id: 'pat-nav-9',
            title: 'Hospital Directory',
            subtitle: 'Find affiliated hospitals, emergency centers and clinics',
            category: 'Hospital',
            path: '/patient/hospitals',
            keywords: ['hospital', 'hospitals', 'clinic', 'medical center', 'emergency room'],
          },
          {
            id: 'pat-nav-10',
            title: 'Health Calendar',
            subtitle: 'Calendar of medical appointments and medication schedules',
            category: 'Navigation',
            path: '/patient/calendar',
            keywords: ['calendar', 'health calendar', 'schedule', 'events', 'dates'],
          },
          {
            id: 'pat-nav-11',
            title: 'Health Timeline',
            subtitle: 'Chronological timeline of health milestones and vital trends',
            category: 'Navigation',
            path: '/patient/timeline',
            keywords: ['timeline', 'health timeline', 'chronological', 'history', 'trends'],
          },
          {
            id: 'pat-nav-12',
            title: 'Access Permissions & Privacy',
            subtitle: 'Control doctor EMR access, review pending requests & grant consent',
            category: 'Access & Privacy',
            path: '/patient/access-permissions',
            keywords: ['permissions', 'privacy', 'access', 'consent', 'grant', 'revoke', 'doctor access'],
          },
          {
            id: 'pat-nav-13',
            title: 'Audit Trail & Blockchain Proof',
            subtitle: 'Cryptographic proof and immutable access logs for your records',
            category: 'Security',
            path: '/patient/audit',
            keywords: ['audit', 'audit trail', 'blockchain', 'proof', 'security', 'logs'],
          },
          {
            id: 'pat-nav-14',
            title: 'Security Settings',
            subtitle: 'Two-factor authentication, biometric security & session management',
            category: 'Security',
            path: '/patient/security',
            keywords: ['security', '2fa', 'password', 'sessions', 'biometric', 'settings'],
          },
          {
            id: 'pat-nav-15',
            title: 'Emergency Care & Contacts',
            subtitle: 'Emergency profile, trusted contacts and trauma medical instructions',
            category: 'Emergency',
            path: '/patient/emergency',
            keywords: ['emergency', 'emergency care', 'contacts', 'trauma', 'allergies', 'blood group'],
          },
          {
            id: 'pat-nav-16',
            title: 'Patient Profile & Health ID',
            subtitle: 'View Sovereign Health ID, personal info and emergency details',
            category: 'Navigation',
            path: '/patient/profile',
            keywords: ['profile', 'account', 'health id', 'my profile', 'personal details'],
          },
          {
            id: 'pat-nav-17',
            title: 'Help Desk & Support',
            subtitle: 'Submit support inquiries, report issues and track tickets',
            category: 'Help',
            path: '/patient/helpdesk',
            keywords: ['help', 'helpdesk', 'support', 'tickets', 'issue', 'inquiries'],
          },
          {
            id: 'pat-nav-18',
            title: 'Notifications Center',
            subtitle: 'View consent requests, appointment updates and health alerts',
            category: 'Navigation',
            path: '/patient/notifications',
            keywords: ['notifications', 'alerts', 'messages', 'updates'],
          },
        ];

      case 'DOCTOR':
        return [
          {
            id: 'doc-nav-1',
            title: 'Doctor Dashboard',
            subtitle: 'Clinical practice overview, today\'s appointments and emergency sessions',
            category: 'Navigation',
            path: '/doctor/dashboard',
            keywords: ['dashboard', 'home', 'overview', 'schedule', 'doctor home'],
          },
          {
            id: 'doc-nav-2',
            title: 'Outbound Access Requests',
            subtitle: 'Dispatch scoped consent requests to patients and manage clearance',
            category: 'Access & Privacy',
            path: '/doctor/access-requests',
            keywords: ['access', 'access requests', 'requests', 'consent', 'clearance', 'emr access', 'ping patient'],
          },
          {
            id: 'doc-nav-3',
            title: 'Patient Search & Directory',
            subtitle: 'Search registered patients by Sovereign Health ID and request EMR clearance',
            category: 'Patient',
            path: '/doctor/patients',
            keywords: ['patient', 'patients', 'search patient', 'directory', 'find patient', 'health id'],
          },
          {
            id: 'doc-nav-4',
            title: 'Authorized Patients (Current EMR)',
            subtitle: 'Patients with active consent permissions or active emergency clearance',
            category: 'Patient',
            path: '/doctor/active-patients',
            keywords: ['authorized', 'active patients', 'current patient', 'emr', 'my patients', 'clearance active'],
          },
          {
            id: 'doc-nav-5',
            title: 'Clinical Consultations',
            subtitle: 'Document clinical evaluations, SOAP notes & diagnosis summaries',
            category: 'Medical Record',
            path: '/doctor/consultations',
            keywords: ['consultation', 'consultations', 'clinical notes', 'diagnosis', 'soap notes'],
          },
          {
            id: 'doc-nav-6',
            title: 'Prescriptions Console',
            subtitle: 'Issue digitally signed e-prescriptions & medication regimens',
            category: 'Prescription',
            path: '/doctor/prescriptions',
            keywords: ['prescription', 'prescriptions', 'rx', 'issue prescription', 'medicine', 'dosage'],
          },
          {
            id: 'doc-nav-7',
            title: 'Lab Reports & Diagnostics',
            subtitle: 'Review laboratory test investigations and diagnostic reports',
            category: 'Medical Record',
            path: '/doctor/lab-reports',
            keywords: ['lab', 'lab reports', 'diagnostics', 'investigations', 'pathology', 'results'],
          },
          {
            id: 'doc-nav-8',
            title: 'Appointments Management',
            subtitle: 'Manage consultation schedule, confirm bookings and update status',
            category: 'Appointment',
            path: '/doctor/appointments',
            keywords: ['appointment', 'appointments', 'schedule', 'calendar', 'visits', 'patients queue'],
          },
          {
            id: 'doc-nav-9',
            title: 'Emergency Break-Glass Access',
            subtitle: 'Initiate trauma emergency override with blockchain audit logging',
            category: 'Emergency',
            path: '/doctor/emergency',
            keywords: ['emergency', 'break glass', 'trauma', 'emergency access', 'critical override'],
          },
          {
            id: 'doc-nav-10',
            title: 'Doctor Profile & Credentials',
            subtitle: 'Medical council registration (NMC), affiliations and specialty profile',
            category: 'Doctor',
            path: '/doctor/profile',
            keywords: ['profile', 'accreditation', 'nmc', 'registration', 'specialization', 'doctor profile'],
          },
          {
            id: 'doc-nav-11',
            title: 'Practice Settings & Availability',
            subtitle: 'Configure consultation working hours, slot duration & consultation types',
            category: 'Navigation',
            path: '/doctor/settings',
            keywords: ['settings', 'availability', 'working hours', 'slots', 'practice'],
          },
          {
            id: 'doc-nav-12',
            title: 'Doctor Notifications',
            subtitle: 'Patient consent approvals, appointment bookings & emergency alerts',
            category: 'Navigation',
            path: '/doctor/notifications',
            keywords: ['notifications', 'alerts', 'consent granted', 'new appointment'],
          },
          {
            id: 'doc-nav-13',
            title: 'Clinical Audit History',
            subtitle: 'Immutable record of all clinical actions and EMR consultations',
            category: 'Security',
            path: '/doctor/audit',
            keywords: ['audit', 'audit trail', 'logs', 'access history', 'compliance'],
          },
        ];

      case 'ADMIN':
        return [
          {
            id: 'adm-nav-1',
            title: 'Admin Dashboard',
            subtitle: 'System metrics, active practitioner stats and compliance overview',
            category: 'Navigation',
            path: '/admin/dashboard',
            keywords: ['dashboard', 'admin', 'overview', 'system', 'metrics'],
          },
          {
            id: 'adm-nav-2',
            title: 'Doctor Approvals & Verification',
            subtitle: 'Verify NMC medical credentials and approve doctor registrations',
            category: 'Doctor',
            path: '/admin/doctors',
            keywords: ['doctor', 'doctors', 'verification', 'approvals', 'credentials', 'nmc', 'practitioners'],
          },
          {
            id: 'adm-nav-3',
            title: 'Hospital Directory Management',
            subtitle: 'Manage accredited hospitals, trauma facilities and department networks',
            category: 'Hospital',
            path: '/admin/hospitals',
            keywords: ['hospital', 'hospitals', 'network', 'departments', 'facilities'],
          },
          {
            id: 'adm-nav-4',
            title: 'System Security & Alert Center',
            subtitle: 'Monitor unauthorized access attempts, tampering alerts & threat logs',
            category: 'Security',
            path: '/admin/security',
            keywords: ['security', 'alerts', 'incidents', 'tampering', 'threats', 'compliance'],
          },
          {
            id: 'adm-nav-5',
            title: 'Audit Trail & Blockchain Ledger',
            subtitle: 'Inspect immutable system-wide audit events and transaction proofs',
            category: 'Security',
            path: '/admin/audit',
            keywords: ['audit', 'audit trail', 'blockchain', 'ledger', 'transactions', 'logs'],
          },
          {
            id: 'adm-nav-6',
            title: 'Platform Configuration & Settings',
            subtitle: 'Manage platform policies, data retention and system parameters',
            category: 'Navigation',
            path: '/admin/settings',
            keywords: ['settings', 'configuration', 'policies', 'system settings'],
          },
          {
            id: 'adm-nav-7',
            title: 'Admin Notifications',
            subtitle: 'Security alerts, practitioner applications and system status updates',
            category: 'Navigation',
            path: '/admin/notifications',
            keywords: ['notifications', 'alerts', 'system notices'],
          },
          {
            id: 'adm-nav-8',
            title: 'Help Desk Oversight',
            subtitle: 'Review user support tickets and technical inquiries across the platform',
            category: 'Help',
            path: '/admin/helpdesk',
            keywords: ['help', 'helpdesk', 'support', 'tickets', 'inquiries'],
          },
          {
            id: 'adm-nav-9',
            title: 'Emergency Break-Glass Oversight',
            subtitle: 'Audit emergency trauma overrides and review clinical justification logs',
            category: 'Emergency',
            path: '/admin/emergency-oversight',
            keywords: ['emergency', 'emergency oversight', 'break glass audit', 'trauma log'],
          },
        ];

      case 'DASHBOARD':
      default:
        return [
          {
            id: 'dash-1',
            title: 'Electronic Medical Records (EMR)',
            subtitle: 'Sovereign patient records, consultations, prescriptions & diagnostic reports',
            category: 'Application',
            path: role === 'DOCTOR' ? '/doctor/dashboard' : '/patient/records',
            keywords: ['emr', 'electronic medical records', 'records', 'medical', 'history', 'health records', 'patient records', 'patient', 'overview', 'features'],
          },
          {
            id: 'dash-2',
            title: 'Patient Portal & Health Management',
            subtitle: 'Sovereign health ID, personalized records & patient consent controls',
            category: 'Application',
            path: role === 'PATIENT' ? '/patient/dashboard' : '/dashboard',
            keywords: ['patient', 'patient portal', 'health id', 'sovereign', 'profile', 'health profile', 'patient module'],
          },
          {
            id: 'dash-3',
            title: 'Doctor Portal & Clinical Clearance',
            subtitle: 'Practitioner verification, outbound access requests & clinical consultation tools',
            category: 'Application',
            path: role === 'DOCTOR' ? '/doctor/dashboard' : '/dashboard',
            keywords: ['doctor', 'doctor portal', 'clinical', 'practitioner', 'doctor module', 'access request', 'clearance'],
          },
          {
            id: 'dash-4',
            title: 'Prescriptions & Medication Schedules',
            subtitle: 'Digitally signed electronic prescriptions and medication refill tracking',
            category: 'Feature',
            path: role === 'DOCTOR' ? '/doctor/prescriptions' : '/patient/prescriptions',
            keywords: ['prescription', 'prescriptions', 'medication', 'medicine', 'refill', 'dosage', 'drugs', 'rx'],
          },
          {
            id: 'dash-5',
            title: 'Diagnostic Lab Reports',
            subtitle: 'Biochemistry, pathology, diagnostic imaging & secure laboratory results',
            category: 'Feature',
            path: role === 'DOCTOR' ? '/doctor/lab-reports' : '/patient/lab-reports',
            keywords: ['lab', 'lab reports', 'diagnostics', 'blood test', 'pathology', 'biochemistry', 'imaging', 'radiology'],
          },
          {
            id: 'dash-6',
            title: 'Clinical Consultations',
            subtitle: 'In-person and tele-health consultation summaries and clinical notes',
            category: 'Feature',
            path: role === 'DOCTOR' ? '/doctor/consultations' : '/patient/consultations',
            keywords: ['consultation', 'consultations', 'doctor notes', 'diagnosis', 'clinical review', 'telehealth'],
          },
          {
            id: 'dash-7',
            title: 'Appointments & Scheduling',
            subtitle: 'Real-time appointment booking, doctor schedules and hospital visits',
            category: 'Feature',
            path: role === 'DOCTOR' ? '/doctor/appointments' : '/patient/appointments',
            keywords: ['appointment', 'appointments', 'booking', 'schedule', 'doctor appointment', 'visit', 'calendar'],
          },
          {
            id: 'dash-8',
            title: 'Access & Privacy Console',
            subtitle: 'Granular consent permissions, time-bound access grants and cryptographic proofs',
            category: 'Access & Privacy',
            path: role === 'DOCTOR' ? '/doctor/access-requests' : '/patient/access-permissions',
            keywords: ['permissions', 'privacy', 'access', 'consent', 'grant', 'revoke', 'security', 'data control', 'authorization'],
          },
          {
            id: 'dash-9',
            title: 'Emergency Break-Glass Care',
            subtitle: 'Rapid emergency response protocol with automatic time-bound trauma access',
            category: 'Emergency',
            path: role === 'DOCTOR' ? '/doctor/emergency' : '/patient/emergency',
            keywords: ['emergency', 'break glass', 'trauma', 'emergency care', 'urgent', 'critical', 'emergency contacts'],
          },
          {
            id: 'dash-10',
            title: 'Security & Blockchain Ledger',
            subtitle: 'Immutable tamper-proof audit trails, cryptographic hash verification & SAIF security',
            category: 'Security',
            path: role === 'ADMIN' ? '/admin/audit' : role === 'DOCTOR' ? '/doctor/audit' : '/patient/audit',
            keywords: ['security', 'blockchain', 'audit', 'audit trail', 'tamper', 'hash', 'cryptographic', 'compliance'],
          },
          {
            id: 'dash-11',
            title: 'Hospital Directory & Networks',
            subtitle: 'Accredited healthcare networks, tertiary facilities & department lookup',
            category: 'Hospital',
            path: role === 'ADMIN' ? '/admin/hospitals' : '/patient/hospitals',
            keywords: ['hospital', 'hospitals', 'network', 'healthcare facility', 'clinic', 'departments', 'trauma center'],
          },
          {
            id: 'dash-12',
            title: 'Medicines & Adherence Reminders',
            subtitle: 'Medication tracking, daily dose reminders and prescription refills',
            category: 'Medicine',
            path: role === 'PATIENT' ? '/patient/medicines' : '/dashboard',
            keywords: ['medicines', 'medicine', 'reminders', 'adherence', 'pills', 'dosage'],
          },
          {
            id: 'dash-13',
            title: 'Health Calendar & Timeline',
            subtitle: 'Chronological health events, vital metrics trends and scheduled checkups',
            category: 'Navigation',
            path: role === 'PATIENT' ? '/patient/timeline' : '/dashboard',
            keywords: ['calendar', 'timeline', 'health timeline', 'events', 'milestones'],
          },
          {
            id: 'dash-14',
            title: 'Help Desk & User Support',
            subtitle: 'Technical support tickets, system FAQs, guides and user assistance',
            category: 'Help',
            path: role === 'ADMIN' ? '/admin/helpdesk' : '/patient/helpdesk',
            keywords: ['help', 'helpdesk', 'support', 'faq', 'tickets', 'customer support', 'assistance', 'guide', 'how to use'],
          },
          {
            id: 'dash-15',
            title: 'Notifications & Alerts',
            subtitle: 'System alerts, consent notifications, and appointment reminders',
            category: 'Navigation',
            path: role === 'DOCTOR' ? '/doctor/notifications' : role === 'ADMIN' ? '/admin/notifications' : '/patient/notifications',
            keywords: ['notifications', 'alerts', 'messages', 'reminders'],
          },
        ];
    }
  }, [context, role]);

  // Load authorized user data when search is opened
  const loadDynamicData = useCallback(async () => {
    if (!isAuthenticated) {
      setDynamicItems([]);
      return;
    }

    try {
      if (context === 'PATIENT') {
        const [prescriptionsRes, appointmentsRes, labsRes] = await Promise.allSettled([
          api.getPrescriptions(),
          api.getAppointments(),
          api.getLabReports(),
        ]);

        const items: SearchResultItem[] = [];

        if (prescriptionsRes.status === 'fulfilled' && prescriptionsRes.value?.prescriptions) {
          const raw = prescriptionsRes.value.prescriptions;
          raw.slice(0, 5).forEach((rx: any) => {
            const docName = rx.doctor?.fullName || 'Prescribing Doctor';
            items.push({
              id: `rx-${rx.id}`,
              title: `Prescription: ${rx.diagnosis || rx.title || 'Clinical Prescription'}`,
              subtitle: `Prescribed by Dr. ${docName} • ${rx.date || 'Active'}`,
              category: 'Prescription',
              path: '/patient/prescriptions',
              keywords: ['prescription', 'rx', 'medicine', rx.diagnosis, docName].filter(Boolean),
            });
          });
        }

        if (appointmentsRes.status === 'fulfilled' && appointmentsRes.value?.appointments) {
          const raw = appointmentsRes.value.appointments;
          raw.slice(0, 5).forEach((apt: any) => {
            const docName = apt.doctor?.fullName || 'Doctor';
            items.push({
              id: `apt-${apt.id}`,
              title: `Appointment: Dr. ${docName}`,
              subtitle: `${apt.date} at ${apt.timeSlot} • Status: ${apt.status}`,
              category: 'Appointment',
              path: '/patient/appointments',
              keywords: ['appointment', apt.appointmentNumber, docName, apt.department].filter(Boolean),
            });
          });
        }

        if (labsRes.status === 'fulfilled' && labsRes.value?.labReports) {
          const raw = labsRes.value.labReports;
          raw.slice(0, 5).forEach((lab: any) => {
            items.push({
              id: `lab-${lab.id}`,
              title: `Lab Report: ${lab.testName || lab.title || 'Diagnostic Report'}`,
              subtitle: `${lab.date || 'Recent'} • ${lab.status || 'Verified'}`,
              category: 'Medical Record',
              path: '/patient/lab-reports',
              keywords: ['lab', 'report', lab.testName, lab.title, 'diagnostics'].filter(Boolean),
            });
          });
        }

        setDynamicItems(items);
      } else if (context === 'DOCTOR') {
        const [activePatientsRes, accessReqsRes] = await Promise.allSettled([
          api.getAuthorizedPatients(),
          api.listDoctorAccessRequests(),
        ]);

        const items: SearchResultItem[] = [];

        if (activePatientsRes.status === 'fulfilled' && activePatientsRes.value?.patients) {
          const raw = activePatientsRes.value.patients;
          raw.slice(0, 8).forEach((p: any) => {
            items.push({
              id: `auth-pat-${p.id}`,
              title: `${p.fullName || p.name} (${p.healthId || p.healthcareId})`,
              subtitle: `Authorized Patient • Blood: ${p.bloodGroup || 'N/A'} • Identity: ${p.identityStatus || 'VERIFIED'}`,
              category: 'Patient',
              path: `/doctor/patients/${p.healthId || p.id}/emr`,
              keywords: ['patient', p.fullName, p.name, p.healthId, 'authorized', 'emr'].filter(Boolean),
            });
          });
        }

        if (accessReqsRes.status === 'fulfilled' && accessReqsRes.value?.requests) {
          const raw = accessReqsRes.value.requests;
          raw.slice(0, 5).forEach((req: any) => {
            const pName = req.patient?.fullName || req.patientName || 'Patient';
            items.push({
              id: `doc-req-${req.id}`,
              title: `Access Request: ${pName} (${req.patient?.healthId || ''})`,
              subtitle: `"${req.reason || 'Clinical Consultation'}" • Status: ${req.status}`,
              category: 'Access & Privacy',
              path: '/doctor/access-requests',
              keywords: ['access', 'request', pName, req.patient?.healthId, req.reason].filter(Boolean),
            });
          });
        }

        setDynamicItems(items);
      } else {
        setDynamicItems([]);
      }
    } catch (err) {
      console.warn('Failed to fetch dynamic search context data:', err);
      setDynamicItems([]);
    }
  }, [context, isAuthenticated]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      loadDynamicData();
    } else {
      setQuery('');
      setIsLoading(false);
      setIsError(false);
      setDynamicItems([]);
    }
  }, [isOpen, loadDynamicData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setIsLoading(false);
      setIsError(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    const timer = setTimeout(() => {
      setIsLoading(false);
      if (query.includes('<script>') || query.includes('DROP TABLE')) {
        setIsError(true);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const allItems: SearchResultItem[] = [...baseItems, ...dynamicItems];

  const q = query.toLowerCase().trim();

  const results = q
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q))
      )
    : allItems.slice(0, 6);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  const getPlaceholder = () => {
    switch (context) {
      case 'PATIENT':
        return t('search.placeholderPatientFull', 'Search your health records, prescriptions, appointments & modules...');
      case 'DOCTOR':
        return t('search.placeholderDoctorFull', 'Search doctor clinical modules, access requests & authorized patients...');
      case 'ADMIN':
        return t('search.placeholderAdminFull', 'Search admin governance modules, doctor verification & system settings...');
      case 'DASHBOARD':
      default:
        return t('search.placeholderDashboardFull', 'Search application features, EMR modules, navigation & help...');
    }
  };

  const getFooterText = () => {
    switch (context) {
      case 'PATIENT':
        return t('search.footerPatient', 'Patient Health Directory & Modules');
      case 'DOCTOR':
        return t('search.footerDoctor', 'Doctor Clinical Directory & Authorized EMR');
      case 'ADMIN':
        return t('search.footerAdmin', 'Admin Governance Directory');
      case 'DASHBOARD':
      default:
        return t('search.footerGeneral', 'Sovereign EMR Application Directory');
    }
  };

  const getCategoryIcon = (category: SearchResultItem['category']) => {
    switch (category) {
      case 'Patient':
        return <User className="w-5 h-5 text-emerald-400" />;
      case 'Doctor':
        return <Stethoscope className="w-5 h-5 text-blue-400" />;
      case 'Hospital':
        return <Building2 className="w-5 h-5 text-teal-400" />;
      case 'Appointment':
        return <Calendar className="w-5 h-5 text-amber-400" />;
      case 'Medical Record':
        return <FileText className="w-5 h-5 text-cyan-400" />;
      case 'Prescription':
        return <Pill className="w-5 h-5 text-purple-400" />;
      case 'Medicine':
        return <Pill className="w-5 h-5 text-purple-400" />;
      case 'Access & Privacy':
        return <Shield className="w-5 h-5 text-purple-400" />;
      case 'Security':
        return <Lock className="w-5 h-5 text-amber-400" />;
      case 'Emergency':
        return <Activity className="w-5 h-5 text-rose-400" />;
      case 'Help':
        return <HelpCircle className="w-5 h-5 text-emerald-400" />;
      case 'Application':
        return <Layers className="w-5 h-5 text-indigo-400" />;
      case 'Feature':
        return <Sparkles className="w-5 h-5 text-blue-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 md:p-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative max-w-2xl mx-auto bg-[#0B0B0D] rounded-3xl shadow-2xl border border-white/[0.12] overflow-hidden font-sans transition-colors">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 sm:px-5 border-b border-white/[0.08] bg-[#101012]">
          <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={getPlaceholder()}
            className="w-full py-4 text-white placeholder-slate-500 bg-transparent text-sm focus:outline-hidden"
          />

          {isLoading && (
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin mr-2 flex-shrink-0" />
          )}

          {query && !isLoading && (
            <button
              onClick={() => setQuery('')}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg mr-2 transition-colors cursor-pointer"
              title={t('search.clearSearch', 'Clear Search')}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-[#18181B] border border-white/[0.10] rounded">
            ESC
          </kbd>
        </div>

        {/* Search Content Body */}
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {isError ? (
            <div className="p-8 text-center space-y-2 text-xs">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h4 className="font-bold text-white">{t('search.errorTitle', 'Search Error')}</h4>
              <p className="text-slate-400">{t('search.errorMessage', 'Invalid search pattern entered. Please check your query.')}</p>
              <button
                onClick={() => setQuery('')}
                className="mt-2 text-blue-400 font-bold hover:underline cursor-pointer"
              >
                {t('search.clearSearch', 'Clear Search')}
              </button>
            </div>
          ) : isLoading ? (
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-white/[0.06] rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-40 h-3.5 bg-white/[0.08] rounded" />
                  <div className="w-64 h-2.5 bg-white/[0.04] rounded" />
                </div>
              </div>
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 bg-white/[0.06] rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-48 h-3.5 bg-white/[0.08] rounded" />
                  <div className="w-56 h-2.5 bg-white/[0.04] rounded" />
                </div>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-10 text-center space-y-2 text-xs">
              <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="font-bold text-white text-sm">{t('search.noResultsTitle', 'No Matching Results')}</h4>
              <p className="text-slate-400 max-w-sm mx-auto">
                {t('search.noResultsDesc', 'No matching module, feature, or record found for "{query}".', { query })}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {query.trim()
                  ? `${t('search.matchingResults', 'Matching Results')} (${results.length})`
                  : t('search.shortcuts', 'Recommended Shortcuts')}
              </div>

              {results.map((item) => {
                const categoryKey = `search.category${item.category.replace(/\s+/g, '')}`;
                const localizedCategory = t(categoryKey, item.category);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.path)}
                    className="w-full px-4 py-3 rounded-2xl flex items-center justify-between hover:bg-white/[0.06] text-left transition-colors group cursor-pointer border border-transparent hover:border-white/[0.08]"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-white/[0.06] group-hover:bg-white/[0.10] flex items-center justify-center flex-shrink-0">
                        {getCategoryIcon(item.category)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white group-hover:text-blue-400 truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.08] text-slate-300 flex-shrink-0">
                            {localizedCategory}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0 ml-3" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-[#101012] border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
          <span>{getFooterText()}</span>
          <span>{t('search.footerEsc', 'Press ESC to dismiss')}</span>
        </div>
      </div>
    </div>
  );
};
