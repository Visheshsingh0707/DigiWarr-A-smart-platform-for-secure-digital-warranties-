import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Shopkeeper dashboard stats
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'SHOPKEEPER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count via junction table
    const totalCustomers = await prisma.shopkeeperCustomer.count({
      where: { shopkeeperId: session.user.id },
    });

    // Get all customer IDs via junction table
    const links = await prisma.shopkeeperCustomer.findMany({
      where: { shopkeeperId: session.user.id },
      select: { customerId: true },
    });
    const customerIds = links.map((l) => l.customerId);

    const activeWarranties = await prisma.document.count({
      where: {
        userId: { in: customerIds },
        createdByShopkeeper: true,
        shopkeeperId: session.user.id,
        type: 'WARRANTY',
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } },
        ],
      },
    });

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const expiringSoon = await prisma.document.count({
      where: {
        userId: { in: customerIds },
        createdByShopkeeper: true,
        shopkeeperId: session.user.id,
        type: 'WARRANTY',
        expiryDate: {
          gte: now,
          lte: thirtyDaysLater,
        },
      },
    });

    const totalWarranties = await prisma.document.count({
      where: {
        userId: { in: customerIds },
        createdByShopkeeper: true,
        shopkeeperId: session.user.id,
        type: 'WARRANTY',
      },
    });

    const extendedWarrantiesSold = await prisma.document.count({
      where: {
        userId: { in: customerIds },
        createdByShopkeeper: true,
        shopkeeperId: session.user.id,
        type: 'WARRANTY',
        extendedStatus: 'purchased',
      },
    });

    const extendedRevenueAggr = await prisma.document.aggregate({
      where: {
        userId: { in: customerIds },
        createdByShopkeeper: true,
        shopkeeperId: session.user.id,
        type: 'WARRANTY',
        extendedStatus: 'purchased',
      },
      _sum: {
        extendedPrice: true,
      },
    });
    const extendedRevenue = extendedRevenueAggr._sum.extendedPrice || 0;

    return NextResponse.json({
      totalCustomers,
      activeWarranties,
      expiringSoon,
      totalWarranties,
      extendedWarrantiesSold,
      extendedRevenue,
      limit: 10,
      isAtLimit: totalCustomers >= 10,
      remainingSlots: Math.max(0, 10 - totalCustomers),
    });
  } catch (error) {
    console.error('Shopkeeper stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
