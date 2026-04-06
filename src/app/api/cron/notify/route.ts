import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendExpiryNotification } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

// GET: Cron endpoint to send expiry notifications
// Secured with CRON_SECRET header
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const oneDayLater = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

    // Normalize to start/end of day for accurate matching
    const startOf1Day = new Date(oneDayLater.getFullYear(), oneDayLater.getMonth(), oneDayLater.getDate());
    const endOf1Day = new Date(startOf1Day.getTime() + 24 * 60 * 60 * 1000);
    const startOf2Days = new Date(twoDaysLater.getFullYear(), twoDaysLater.getMonth(), twoDaysLater.getDate());
    const endOf2Days = new Date(startOf2Days.getTime() + 24 * 60 * 60 * 1000);

    let notificationsSent = 0;
    let errors = 0;

    // Find documents expiring in 2 days (not yet notified)
    const docs2Days = await prisma.document.findMany({
      where: {
        expiryDate: {
          gte: startOf2Days,
          lt: endOf2Days,
        },
        notified2d: false,
      },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    });

    for (const doc of docs2Days) {
      const success = await sendExpiryNotification({
        to: doc.user.email,
        userName: doc.user.name || '',
        documentTitle: doc.title,
        documentType: doc.type,
        daysLeft: 2,
        expiryDate: doc.expiryDate!,
      });

      if (success) {
        await prisma.document.update({
          where: { id: doc.id },
          data: { notified2d: true },
        });
        notificationsSent++;
      } else {
        errors++;
      }
    }

    // Find documents expiring in 1 day (not yet notified)
    const docs1Day = await prisma.document.findMany({
      where: {
        expiryDate: {
          gte: startOf1Day,
          lt: endOf1Day,
        },
        notified1d: false,
      },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    });

    for (const doc of docs1Day) {
      const success = await sendExpiryNotification({
        to: doc.user.email,
        userName: doc.user.name || '',
        documentTitle: doc.title,
        documentType: doc.type,
        daysLeft: 1,
        expiryDate: doc.expiryDate!,
      });

      if (success) {
        await prisma.document.update({
          where: { id: doc.id },
          data: { notified1d: true },
        });
        notificationsSent++;
      } else {
        errors++;
      }
    }

    return NextResponse.json({
      message: 'Notification cron completed',
      notificationsSent,
      errors,
      checked: {
        twoDays: docs2Days.length,
        oneDay: docs1Day.length,
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Cron notification error:', error);
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
