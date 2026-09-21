import { Request, Response, NextFunction } from 'express';
import { prisma } from '../models/prisma.js';

/**
 * Ensures authenticated user possesses one of the authorized roles.
 */
export function requireRole(...allowedRoles: Array<'PATIENT' | 'DOCTOR' | 'ADMIN'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication is required to access this resource.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'ACCESS_FORBIDDEN',
        message: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] roles. Your role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
}

/**
 * Ensures doctor account has been reviewed and verified by an Administrator.
 */
export function requireVerifiedDoctor(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'DOCTOR') {
    res.status(403).json({
      success: false,
      error: 'ROLE_MISMATCH',
      message: 'This operation requires a Doctor profile.',
    });
    return;
  }

  const isApproved = ['APPROVED', 'VERIFIED', 'ACTIVE'].includes(req.user.doctorStatus || '');
  if (!isApproved) {
    res.status(403).json({
      success: false,
      error: 'DOCTOR_NOT_VERIFIED',
      doctorStatus: req.user.doctorStatus,
      message: `Doctor access restricted: Your professional verification status is "${req.user.doctorStatus}". Patient EMR access is granted only after Admin verification approval.`,
    });
    return;
  }

  next();
}

/**
 * Checks if the doctor possesses active, unexpired consent permission
 * covering the target patient and requested record scope.
 */
export function requireActivePatientPermission(requiredScope: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const doctorId = req.user?.doctorId;
    const targetPatientId = req.params.patientId || req.query.patientId as string || req.body.patientId;

    if (!doctorId) {
      res.status(403).json({
        success: false,
        error: 'DOCTOR_ID_MISSING',
        message: 'Doctor ID context not found.',
      });
      return;
    }

    if (!targetPatientId) {
      res.status(400).json({
        success: false,
        error: 'PATIENT_ID_REQUIRED',
        message: 'Target patient ID is required to verify access permission.',
      });
      return;
    }

    // Check if an active emergency session exists for this patient & doctor
    const activeEmergency = await prisma.emergencySession.findFirst({
      where: {
        patientId: targetPatientId,
        doctorId,
        status: 'ACTIVE',
        autoExpiryTime: { gt: new Date() },
      },
    });

    if (activeEmergency) {
      // Emergency session permits access to critical categories
      return next();
    }

    // Check normal active permission
    const permission = await prisma.permission.findFirst({
      where: {
        patientId: targetPatientId,
        doctorId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
    });

    if (!permission) {
      res.status(403).json({
        success: false,
        error: 'PERMISSION_DENIED',
        message: 'Access Denied: You do not have an active consent permission from this patient. Please submit an Access Request.',
      });
      return;
    }

    // Validate scope
    try {
      const allowedScopes: string[] = JSON.parse(permission.scopeJson);
      if (!allowedScopes.includes(requiredScope) && !allowedScopes.includes('ALL')) {
        res.status(403).json({
          success: false,
          error: 'SCOPE_EXCEEDED',
          message: `Access Denied: Patient granted permission for [${allowedScopes.join(', ')}], but requested record requires [${requiredScope}].`,
        });
        return;
      }
    } catch {
      // If parsing fails, fall back to checking text
      if (!permission.approvedScope.toUpperCase().includes(requiredScope.toUpperCase())) {
        res.status(403).json({
          success: false,
          error: 'SCOPE_EXCEEDED',
          message: `Access Denied: Requested scope [${requiredScope}] is not covered by approved permission.`,
        });
        return;
      }
    }

    next();
  };
}
