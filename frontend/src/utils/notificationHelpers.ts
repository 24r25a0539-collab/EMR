/**
 * Safely extract metadata object from a notification
 */
export function getNotificationMetadata(notif: any): Record<string, any> {
  if (!notif) return {};
  if (notif.metadataJson) {
    if (typeof notif.metadataJson === 'object') {
      return notif.metadataJson;
    }
    try {
      const parsed = JSON.parse(notif.metadataJson);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      // Safely ignore JSON parse errors
    }
  }
  if (notif.metadata && typeof notif.metadata === 'object') {
    return notif.metadata;
  }
  return {};
}

/**
 * Extract prescription ID from notification based on priority:
 * 1. structured metadataJson.prescriptionId / metadataJson.id
 * 2. notif.relatedEntityId / notif.prescriptionId / notif.referenceId / notif.resourceId
 * 3. parse from notif.linkRoute (e.g. /patient/prescriptions/:id)
 */
export function getPrescriptionIdFromNotification(notif: any): string | null {
  if (!notif) return null;

  const metadata = getNotificationMetadata(notif);
  if (
    metadata.prescriptionId &&
    typeof metadata.prescriptionId === 'string' &&
    metadata.prescriptionId.trim() &&
    metadata.prescriptionId !== 'undefined' &&
    metadata.prescriptionId !== 'null'
  ) {
    return metadata.prescriptionId.trim();
  }
  if (
    metadata.id &&
    typeof metadata.id === 'string' &&
    metadata.id.trim() &&
    metadata.id !== 'undefined' &&
    metadata.id !== 'null'
  ) {
    return metadata.id.trim();
  }

  const directId = notif.prescriptionId || notif.relatedEntityId || notif.referenceId || notif.resourceId;
  if (
    directId &&
    typeof directId === 'string' &&
    directId.trim() &&
    directId !== 'undefined' &&
    directId !== 'null'
  ) {
    return directId.trim();
  }

  // Fallback: parse ID from linkRoute if it matches /patient/prescriptions/:id
  const link = notif.linkRoute || notif.link || notif.actionUrl;
  if (link && typeof link === 'string') {
    const match = link.match(/\/patient\/prescriptions\/([a-zA-Z0-9_-]+)/);
    if (match && match[1] && match[1] !== 'undefined' && match[1] !== 'null') {
      return match[1];
    }
  }

  return null;
}
