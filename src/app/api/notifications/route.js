import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const branch = searchParams.get('branch');
    const cls = searchParams.get('class');
    const userId = searchParams.get('userId');

    const where = {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ]
    };

    // Filter by role
    if (role) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { targetRole: { has: role } },
          { targetRole: { has: 'All' } }
        ]
      });
    }

    // Filter by branch
    if (branch) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { targetBranch: branch },
          { targetBranch: 'All' }
        ]
      });
    }

    // Filter by class
    if (cls) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { targetClass: cls },
          { targetClass: 'All' }
        ]
      });
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50,
    });

    // If userId provided, get read status
    if (userId) {
      const readStatuses = await prisma.userNotification.findMany({
        where: {
          userId,
          notificationId: { in: notifications.map(n => n.id) }
        }
      });

      const readMap = new Map(readStatuses.map(r => [r.notificationId, r.isRead]));

      const withReadStatus = notifications.map(n => ({
        ...n,
        isRead: readMap.get(n.id) || false
      }));

      return NextResponse.json({ success: true, data: withReadStatus });
    }

    return NextResponse.json({ success: true, data: notifications });
  } catch (err) {
    console.error('GET notifications error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}