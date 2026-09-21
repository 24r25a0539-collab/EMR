const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('emr_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Only evict the authentication token if the token itself is expired, invalid, or user account is gone
    if (res.status === 401 && (data.error === 'SESSION_EXPIRED' || data.error === 'INVALID_TOKEN' || data.error === 'USER_NOT_FOUND')) {
      localStorage.removeItem('emr_token');
      localStorage.removeItem('emr_user');
    }
    const errorMsg = data.message || data.error || `HTTP Error ${res.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

export const api = {
  // Auth API
  async patientRequestOtp(identifier: string) {
    const res = await fetch(`${API_BASE}/auth/patient/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    return handleResponse<any>(res);
  },

  async patientVerifyOtp(identifier: string, otp: string) {
    const res = await fetch(`${API_BASE}/auth/patient/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, otp }),
    });
    return handleResponse<any>(res);
  },

  async patientRegistrationRequestOtp(mobile: string) {
    const res = await fetch(`${API_BASE}/auth/patient/registration-request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile }),
    });
    return handleResponse<any>(res);
  },

  async patientRegistrationVerifyOtp(mobile: string, otp: string) {
    const res = await fetch(`${API_BASE}/auth/patient/registration-verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, otp }),
    });
    return handleResponse<any>(res);
  },

  async patientRegister(data: any) {
    const res = await fetch(`${API_BASE}/auth/patient/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async doctorLogin(identifier: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/doctor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    return handleResponse<any>(res);
  },

  async doctorRegister(data: any) {
    const res = await fetch(`${API_BASE}/auth/doctor/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async doctorChangePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    const res = await fetch(`${API_BASE}/auth/doctor/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    return handleResponse<any>(res);
  },

  async adminLogin(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<any>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getPatientProfile() {
    const res = await fetch(`${API_BASE}/patients/me`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getProfile() {
    return this.getPatientProfile();
  },

  async updatePatientProfile(data: any) {
    const res = await fetch(`${API_BASE}/patients/me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async getPatientRecords() {
    const res = await fetch(`${API_BASE}/patients/me/records`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getConsultations() {
    const res = await fetch(`${API_BASE}/patients/me/consultations`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getConsultationById(id: string) {
    const res = await fetch(`${API_BASE}/patients/me/consultations/${id}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getPrescriptions() {
    const res = await fetch(`${API_BASE}/patients/me/prescriptions`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getPrescriptionById(id: string) {
    const res = await fetch(`${API_BASE}/patients/me/prescriptions/${id}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getLabReports() {
    const res = await fetch(`${API_BASE}/patients/me/labs`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getLabReportById(id: string) {
    const res = await fetch(`${API_BASE}/patients/me/labs/${id}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getMedicines() {
    const res = await fetch(`${API_BASE}/patients/me/medicines`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async updateMedicineAction(id: string, action: string) {
    const res = await fetch(`${API_BASE}/patients/me/medicines/${id}/action`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ action }),
    });
    return handleResponse<any>(res);
  },

  async addPatientMedicine(data: any) {
    const res = await fetch(`${API_BASE}/patients/me/medicines`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async addPatientAllergy(data: { allergen: string; severity?: string; reaction?: string; notes?: string }) {
    const res = await fetch(`${API_BASE}/patients/me/allergies`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async deletePatientAllergy(id: string) {
    const res = await fetch(`${API_BASE}/patients/me/allergies/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async getAppointments() {
    const res = await fetch(`${API_BASE}/patients/me/appointments`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async bookAppointment(data: any) {
    const res = await fetch(`${API_BASE}/patients/me/appointments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async cancelAppointment(id: string, reason?: string) {
    const res = await fetch(`${API_BASE}/patients/me/appointments/${id}/cancel`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse<any>(res);
  },

  async getAccessPermissions() {
    const res = await fetch(`${API_BASE}/patients/me/access-permissions`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async approveAccessRequest(id: string, scopes: string[], durationDays: number, isForever?: boolean, durationHours?: number) {
    const res = await fetch(`${API_BASE}/patients/me/access-requests/${id}/approve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ scopes, durationDays, isForever, durationHours }),
    });
    return handleResponse<any>(res);
  },

  async rejectAccessRequest(id: string, reason: string) {
    const res = await fetch(`${API_BASE}/patients/me/access-requests/${id}/reject`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse<any>(res);
  },

  async revokePermission(id: string, reason?: string) {
    const res = await fetch(`${API_BASE}/patients/me/permissions/${id}/revoke`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse<any>(res);
  },

  async manageEmergencyContacts(data: any) {
    const res = await fetch(`${API_BASE}/patients/me/emergency-contacts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async getPatientAuditHistory(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/patients/me/audit${query}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async requestCorrection(data: any) {
    const res = await fetch(`${API_BASE}/patients/me/correction-requests`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async uploadLabReport(data: any) {
    const res = await fetch(`${API_BASE}/patients/me/lab-reports`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // Documents & Document Privacy
  async getDocuments() {
    const res = await fetch(`${API_BASE}/patients/me/documents`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getDocumentById(id: string) {
    const res = await fetch(`${API_BASE}/patients/me/documents/${id}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async updateDocumentPrivacy(id: string, data: { visibility?: string; allowEmergencyAccess?: boolean }) {
    const res = await fetch(`${API_BASE}/patients/me/documents/${id}/privacy`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async markNotificationRead(id: string) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async deleteNotification(id: string) {
    const res = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  // Patient Helpdesk
  async getPatientHelpdeskTickets() {
    const res = await fetch(`${API_BASE}/patients/me/helpdesk`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async createHelpdeskTicket(data: any) {
    const res = await fetch(`${API_BASE}/patients/me/helpdesk`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // Doctor Portal APIs
  async getDoctorDashboard() {
    const res = await fetch(`${API_BASE}/doctors/dashboard`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getDoctorProfile() {
    const res = await fetch(`${API_BASE}/doctors/profile`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async updateDoctorSettings(data: any) {
    const res = await fetch(`${API_BASE}/doctors/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async searchPatients(query: string, searchType?: string) {
    const res = await fetch(`${API_BASE}/doctors/patients/search`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ query, searchType: searchType || 'all', type: searchType || 'all' }),
    });
    return handleResponse<any>(res);
  },

  async createDoctorAccessRequest(healthId: string, reason: string, scopes: string[], requestedDuration: string) {
    const res = await fetch(`${API_BASE}/doctors/access-requests`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ healthId, reason, scopes, requestedDuration }),
    });
    return handleResponse<any>(res);
  },

  async listDoctorAccessRequests() {
    const res = await fetch(`${API_BASE}/doctors/access-requests`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getAuthorizedPatients() {
    const res = await fetch(`${API_BASE}/doctors/active-patients`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getAuthorizedEMR(patientId: string) {
    const res = await fetch(`${API_BASE}/doctors/patients/${patientId}/emr`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async createConsultation(data: any) {
    const res = await fetch(`${API_BASE}/doctors/consultations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async updateConsultation(id: string, data: any) {
    const res = await fetch(`${API_BASE}/doctors/consultations/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async createPrescription(data: any) {
    const res = await fetch(`${API_BASE}/doctors/prescriptions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async createLabReport(data: any) {
    const res = await fetch(`${API_BASE}/doctors/lab-reports`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async initiateEmergencyAccess(data: { healthId: string; reason: string; condition?: string; incident?: string; confirmation: boolean; hospitalId?: string } | string, legacyReason?: string) {
    const payload = typeof data === 'string'
      ? { healthId: data, reason: legacyReason || 'Critical Emergency', condition: 'Acute Trauma / Unresponsive', confirmation: true }
      : data;
    const res = await fetch(`${API_BASE}/doctors/emergency/initiate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  async addEmergencyTreatmentNote(sessionId: string, note: string) {
    const res = await fetch(`${API_BASE}/doctors/emergency/${sessionId}/note`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ note }),
    });
    return handleResponse<any>(res);
  },

  async endEmergencySession(sessionId: string) {
    const res = await fetch(`${API_BASE}/doctors/emergency/${sessionId}/end`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },

  async getDoctorAppointments() {
    const res = await fetch(`${API_BASE}/doctors/appointments`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async updateDoctorAppointmentStatus(id: string, data: { status: string; notes?: string }) {
    const res = await fetch(`${API_BASE}/doctors/appointments/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // Admin Portal APIs
  async getAdminDashboard() {
    const res = await fetch(`${API_BASE}/admin/dashboard`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getAdminDoctors(status?: string) {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/admin/doctors${query}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async verifyDoctor(id: string, action: string, rejectionReason?: string, notes?: string) {
    const res = await fetch(`${API_BASE}/admin/doctors/${id}/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action, rejectionReason, notes }),
    });
    return handleResponse<any>(res);
  },

  async getAdminHospitals() {
    const res = await fetch(`${API_BASE}/admin/hospitals`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async createHospital(data: any) {
    const res = await fetch(`${API_BASE}/admin/hospitals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async updateHospitalStatus(id: string, status: string) {
    const res = await fetch(`${API_BASE}/admin/hospitals/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<any>(res);
  },

  async getAdminUsers(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/admin/users${query}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async updateAdminUserStatus(id: string, status: string, reason?: string) {
    const res = await fetch(`${API_BASE}/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, reason }),
    });
    return handleResponse<any>(res);
  },

  async getAdminAuditLogs(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/admin/audit${query}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getAdminSecurityAlerts() {
    const res = await fetch(`${API_BASE}/admin/security`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async updateAlertStatus(id: string, status: string, resolutionNotes?: string) {
    const res = await fetch(`${API_BASE}/admin/security/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, resolutionNotes }),
    });
    return handleResponse<any>(res);
  },

  async getAdminBlockchainProofs() {
    const res = await fetch(`${API_BASE}/admin/blockchain`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async simulateTamperingTest(recordId?: string, recordType?: string, tamperedValue?: string) {
    const res = await fetch(`${API_BASE}/admin/blockchain/simulate-tampering`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ recordId, recordType, tamperedValue }),
    });
    return handleResponse<any>(res);
  },

  async getAdminEmergencySessions() {
    const res = await fetch(`${API_BASE}/admin/emergency`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getAdminHelpdeskTickets() {
    const res = await fetch(`${API_BASE}/admin/helpdesk`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async updateAdminHelpdeskTicket(id: string, data: { status?: string; reviewNotes?: string }) {
    const res = await fetch(`${API_BASE}/admin/helpdesk/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // Common Directory & Status APIs
  async getHospitalsDirectory(city?: string, specialty?: string) {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (specialty) params.set('specialty', specialty);
    const res = await fetch(`${API_BASE}/hospitals?${params.toString()}`);
    return handleResponse<any>(res);
  },

  async getDoctorsDirectory(search?: string, specialization?: string, hospital?: string) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (specialization) params.set('specialization', specialization);
    if (hospital) params.set('hospital', hospital);
    const res = await fetch(`${API_BASE}/doctors?${params.toString()}`);
    return handleResponse<any>(res);
  },

  async getDoctorById(id: string) {
    const res = await fetch(`${API_BASE}/doctors/${id}`);
    return handleResponse<any>(res);
  },

  async getDoctorBookedSlots(doctorId: string, date: string) {
    const params = new URLSearchParams({ date });
    const res = await fetch(`${API_BASE}/doctors/${doctorId}/booked-slots?${params.toString()}`);
    return handleResponse<any>(res);
  },

  async getBlockchainStatus() {
    const res = await fetch(`${API_BASE}/blockchain/status`);
    return handleResponse<any>(res);
  },

  async getPatientAudit(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/patients/me/audit${query}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },

  async getDoctorAudit(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_BASE}/doctors/audit${query}`, { headers: getHeaders() });
    return handleResponse<any>(res);
  },
};

export default api;
