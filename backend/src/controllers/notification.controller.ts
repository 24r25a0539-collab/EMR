import { Request, Response } from 'express';
import { prisma } from '../models/prisma.js';

export class NotificationController {
  /**
   * Get notifications for authenticated user (Patient, Doctor, or Admin).
   * Derives recipient strictly from verified JWT user ID.
   */
  async getNotifications(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'AUTHENTICATION_REQUIRED' });
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({
      success: true,
      notifications,
      data: notifications,
      unreadCount,
    });
  }

  /**
   * Mark a single notification or all notifications as read for authenticated user.
   */
  async markNotificationRead(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ success: false, error: 'AUTHENTICATION_REQUIRED' });
      return;
    }

    if (id === 'all') {
      await prisma.notification.updateMany({
        where: { userId },
        data: { isRead: true },
      });
      res.json({ success: true, message: 'All notifications marked as read.' });
      return;
    }

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    const updated = await prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!updated) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    res.json({
      success: true,
      notification: { ...updated, read: true, isRead: true },
    });
  }

  /**
   * Delete / dismiss a notification for authenticated user.
   */
  async deleteNotification(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ success: false, error: 'AUTHENTICATION_REQUIRED' });
      return;
    }

    await prisma.notification.deleteMany({
      where: { id, userId },
    });

    res.json({ success: true, message: 'Notification dismissed successfully.' });
  }
}

export const notificationController = new NotificationController();
