import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../models/prisma.js';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  mobile: string | null;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN';
  status: string;
  patientId?: string;
  healthId?: string;
  doctorId?: string;
  doctorRegNumber?: string;
  doctorStatus?: string;
  adminId?: string;
  fullName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Validates JWT Bearer token and attaches authenticated user context to Request.
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Access token is required. Please log in to continue.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        patient: true,
        doctor: true,
        admin: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'The account associated with this token no longer exists.',
      });
      return;
    }

    if (user.status === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended by administration. Contact hospital security.',
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      role: user.role as 'PATIENT' | 'DOCTOR' | 'ADMIN',
      status: user.status,
      patientId: user.patient?.id,
      healthId: user.patient?.healthId,
      doctorId: user.doctor?.id,
      doctorRegNumber: user.doctor?.registrationNumber,
      doctorStatus: user.doctor?.regStatus,
      adminId: user.admin?.id,
      fullName: user.patient?.fullName || user.doctor?.fullName || user.admin?.fullName || 'User',
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'SESSION_EXPIRED',
        message: 'Your login session has expired. Please sign in again.',
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid or forged authentication token.',
    });
  }
}
