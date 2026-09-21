import { api } from './api';

export type DocumentVisibility = 'NORMAL' | 'PRIVATE';

export interface PatientDocumentItem {
  id: string;
  title: string;
  category: 'Lab Report' | 'Prescription' | 'Clinical Note' | 'Imaging' | 'Personal Health' | string;
  date: string;
  doctorName: string;
  hospital: string;
  visibility: DocumentVisibility;
  allowEmergencyAccess: boolean;
  sha256: string;
  verified: boolean;
  fileSize?: string;
  documentType?: string;
}

const EVENT_NAME = 'emr_document_privacy_changed';

class DocumentPrivacyService {
  public async fetchDocuments(): Promise<PatientDocumentItem[]> {
    try {
      const res = await api.getDocuments();
      if (res && res.success && Array.isArray(res.documents)) {
        return res.documents;
      }
      return [];
    } catch (e) {
      console.error('Failed to fetch documents from database:', e);
      return [];
    }
  }

  public async setVisibility(id: string, visibility: DocumentVisibility): Promise<boolean> {
    try {
      const res = await api.updateDocumentPrivacy(id, { visibility });
      if (res && res.success) {
        this.notifyChange();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to update document visibility:', e);
      throw e;
    }
  }

  public async setEmergencyAccess(id: string, allow: boolean): Promise<boolean> {
    try {
      const res = await api.updateDocumentPrivacy(id, { allowEmergencyAccess: allow });
      if (res && res.success) {
        this.notifyChange();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to update document emergency access:', e);
      throw e;
    }
  }

  public notifyChange() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME));
    }
  }

  /**
   * Explains why a document is or is not available to a doctor or during emergency
   */
  public getAccessExplanation(doc: PatientDocumentItem, isEmergencyMode: boolean = false): string {
    if (doc.visibility === 'PRIVATE') {
      if (doc.allowEmergencyAccess) {
        return 'Hidden from Regular Doctor Access • Accessible ONLY in Verified Emergency';
      }
      return 'Confidential • Completely Hidden Even in Emergency';
    }

    // NORMAL visibility
    if (doc.allowEmergencyAccess) {
      return 'Visible to Doctors with Active Access & in Emergencies';
    }
    return 'Visible to Doctors with Active Access • Excluded from Emergency Override';
  }

  public onDocumentPrivacyChange(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    window.addEventListener(EVENT_NAME, callback);
    return () => window.removeEventListener(EVENT_NAME, callback);
  }

  public onDocumentChange(callback: () => void): () => void {
    return this.onDocumentPrivacyChange(callback);
  }
}

export const documentPrivacyService = new DocumentPrivacyService();

