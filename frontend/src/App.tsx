import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AuthenticatedLayout } from './components/layout/AuthenticatedLayout';

const DoctorAppointmentRedirect: React.FC = () => {
  const { doctorSlug } = useParams<{ doctorSlug: string }>();
  return <Navigate to={`/patient/appointments/book?doctor=${doctorSlug || ''}`} replace />;
};

// Public & Auth Pages
import { LandingPage } from './pages/public/LandingPage';
import { ChooseLanguagePage } from './pages/public/ChooseLanguagePage';
import { RoleSelectionPage } from './pages/auth/RoleSelectionPage';
import { PatientLoginPage } from './pages/auth/PatientLoginPage';
import { PatientRegisterPage } from './pages/auth/PatientRegisterPage';
import { DoctorLoginPage } from './pages/auth/DoctorLoginPage';
import { DoctorRegisterPage } from './pages/auth/DoctorRegisterPage';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';

// Error Pages
import { NotFoundPage } from './pages/errors/NotFoundPage';
import { ForbiddenPage } from './pages/errors/ForbiddenPage';
import { ServerErrorPage } from './pages/errors/ServerErrorPage';

// Patient Dedicated Pages
import { PatientHomePage } from './pages/patient/PatientHomePage';
import { PatientProfilePage } from './pages/patient/PatientProfilePage';
import { PatientMedicalHistoryPage } from './pages/patient/PatientMedicalHistoryPage';
import { PatientConsultationsPage } from './pages/patient/PatientConsultationsPage';
import { PatientPrescriptionsPage } from './pages/patient/PatientPrescriptionsPage';
import { PatientLabReportsPage } from './pages/patient/PatientLabReportsPage';
import { PatientAppointmentsPage } from './pages/patient/PatientAppointmentsPage';
import { PatientBookAppointmentPage } from './pages/patient/PatientBookAppointmentPage';
import { PatientDoctorsPage } from './pages/patient/PatientDoctorsPage';
import { PatientHospitalsPage } from './pages/patient/PatientHospitalsPage';
import { PatientMedicinesPage } from './pages/patient/PatientMedicinesPage';
import { PatientHealthCalendarPage } from './pages/patient/PatientHealthCalendarPage';
import { PatientTimelinePage } from './pages/patient/PatientTimelinePage';
import { PatientAccessPermissionsPage } from './pages/patient/PatientAccessPermissionsPage';
import { PatientEmergencyPage } from './pages/patient/PatientEmergencyPage';
import { PatientNotificationsPage } from './pages/patient/PatientNotificationsPage';
import { PatientAuditPage } from './pages/patient/PatientAuditPage';
import { PatientSecurityPage } from './pages/patient/PatientSecurityPage';
import { PatientSettingsPage } from './pages/patient/PatientSettingsPage';
import { PatientHelpdeskPage } from './pages/patient/PatientHelpdeskPage';

// Doctor Dedicated Pages
import { DoctorDashboardPage } from './pages/doctor/DoctorDashboardPage';
import { DoctorPatientsPage } from './pages/doctor/DoctorPatientsPage';
import { DoctorPatientEmrPage } from './pages/doctor/DoctorPatientEmrPage';
import { DoctorCurrentPatientPage } from './pages/doctor/DoctorCurrentPatientPage';
import { DoctorAccessRequestsPage } from './pages/doctor/DoctorAccessRequestsPage';
import { DoctorAppointmentsPage } from './pages/doctor/DoctorAppointmentsPage';
import { DoctorConsultationPage } from './pages/doctor/DoctorConsultationPage';
import { DoctorPrescriptionsPage } from './pages/doctor/DoctorPrescriptionsPage';
import { DoctorLabReportsPage } from './pages/doctor/DoctorLabReportsPage';
import { DoctorEmergencyPage } from './pages/doctor/DoctorEmergencyPage';
import { DoctorVerificationPage } from './pages/doctor/DoctorVerificationPage';
import { DoctorAuditPage } from './pages/doctor/DoctorAuditPage';
import { DoctorProfilePage } from './pages/doctor/DoctorProfilePage';
import { DoctorSettingsPage } from './pages/doctor/DoctorSettingsPage';
import { DoctorChangePasswordPage } from './pages/doctor/DoctorChangePasswordPage';
import { DoctorNotificationsPage } from './pages/doctor/DoctorNotificationsPage';

// Admin Dedicated Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminDoctorsPage } from './pages/admin/AdminDoctorsPage';
import { AdminHospitalsPage } from './pages/admin/AdminHospitalsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { AdminSecurityPage } from './pages/admin/AdminSecurityPage';
import { AdminBlockchainPage } from './pages/admin/AdminBlockchainPage';
import { AdminEmergencyPage } from './pages/admin/AdminEmergencyPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/choose-language" element={<ChooseLanguagePage />} />
      <Route path="/login" element={<RoleSelectionPage />} />
      <Route path="/patient/login" element={<PatientLoginPage />} />
      <Route path="/patient/register" element={<PatientRegisterPage />} />
      <Route path="/doctor/login" element={<DoctorLoginPage />} />
      <Route path="/doctor/register" element={<DoctorRegisterPage />} />
      <Route path="/doctor/change-password" element={<DoctorChangePasswordPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Error Routes */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="/session-expired" element={<Navigate to="/patient/login" replace />} />

      {/* Top-Level Redirects */}
      <Route path="/appointments/book" element={<Navigate to="/patient/doctors" replace />} />
      <Route path="/appointments/doctor/:doctorSlug" element={<DoctorAppointmentRedirect />} />

      {/* Authenticated Patient Routes */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/patient/home" replace />} />
        <Route path="home" element={<PatientHomePage />} />
        <Route path="profile" element={<PatientProfilePage />} />
        <Route path="medical-history" element={<PatientMedicalHistoryPage />} />
        <Route path="consultations" element={<PatientConsultationsPage />} />
        <Route path="prescriptions" element={<PatientPrescriptionsPage />} />
        <Route path="prescriptions/:id" element={<PatientPrescriptionsPage />} />
        <Route path="lab-reports" element={<PatientLabReportsPage />} />
        <Route path="appointments" element={<PatientAppointmentsPage />} />
        <Route path="appointments/book" element={<PatientBookAppointmentPage />} />
        <Route path="appointments/doctor/:doctorSlug" element={<PatientAppointmentsPage />} />
        <Route path="doctors" element={<PatientDoctorsPage />} />
        <Route path="hospitals" element={<PatientHospitalsPage />} />
        <Route path="medicines" element={<PatientMedicinesPage />} />
        <Route path="health-calendar" element={<PatientHealthCalendarPage />} />
        <Route path="timeline" element={<PatientTimelinePage />} />
        <Route path="access-permissions" element={<PatientAccessPermissionsPage />} />
        <Route path="emergency" element={<PatientEmergencyPage />} />
        <Route path="notifications" element={<PatientNotificationsPage />} />
        <Route path="helpdesk" element={<PatientHelpdeskPage />} />
        <Route path="audit" element={<PatientAuditPage />} />
        <Route path="security" element={<PatientSecurityPage />} />
        <Route path="settings" element={<PatientSettingsPage />} />
      </Route>

      {/* Authenticated Doctor Routes */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR']}>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/doctor/dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboardPage />} />
        <Route path="patients" element={<DoctorPatientsPage />} />
        <Route path="patients/:id" element={<DoctorPatientEmrPage />} />
        <Route path="patients/:id/emr" element={<DoctorPatientEmrPage />} />
        <Route path="patients/:id/reports" element={<DoctorPatientEmrPage />} />
        <Route path="patients/:id/reports/:reportId" element={<DoctorPatientEmrPage />} />
        <Route path="patients/:id/:tab" element={<DoctorPatientEmrPage />} />
        <Route path="current-patient" element={<DoctorCurrentPatientPage />} />
        <Route path="current-patient/:id" element={<DoctorPatientEmrPage />} />
        <Route path="current-patient/:id/emr" element={<DoctorPatientEmrPage />} />
        <Route path="current-patient/:id/reports" element={<DoctorPatientEmrPage />} />
        <Route path="current-patient/:id/reports/:reportId" element={<DoctorPatientEmrPage />} />
        <Route path="current-patient/:id/:tab" element={<DoctorPatientEmrPage />} />
        <Route path="access-requests" element={<DoctorAccessRequestsPage />} />
        <Route path="appointments" element={<DoctorAppointmentsPage />} />
        <Route path="consultation/new" element={<DoctorConsultationPage />} />
        <Route path="prescriptions" element={<DoctorPrescriptionsPage />} />
        <Route path="prescriptions/new" element={<DoctorPrescriptionsPage />} />
        <Route path="lab-reports" element={<DoctorLabReportsPage />} />
        <Route path="emergency" element={<DoctorEmergencyPage />} />
        <Route path="verification" element={<DoctorVerificationPage />} />
        <Route path="audit" element={<DoctorAuditPage />} />
        <Route path="notifications" element={<DoctorNotificationsPage />} />
        <Route path="profile" element={<DoctorProfilePage />} />
        <Route path="settings" element={<DoctorSettingsPage />} />
      </Route>

      {/* Authenticated Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="doctors" element={<AdminDoctorsPage />} />
        <Route path="hospitals" element={<AdminHospitalsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="audit" element={<AdminAuditPage />} />
        <Route path="security" element={<AdminSecurityPage />} />
        <Route path="blockchain" element={<AdminBlockchainPage />} />
        <Route path="emergency" element={<AdminEmergencyPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Catch-all 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
