import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: List all customers for the authenticated shopkeeper (via junction table)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'SHOPKEEPER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const links = await prisma.shopkeeperCustomer.findMany({
      where: { shopkeeperId: session.user.id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            documents: {
              where: {
                createdByShopkeeper: true,
                shopkeeperId: session.user.id,
              },
              select: {
                id: true,
                title: true,
                type: true,
                expiryDate: true,
                productName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const customers = links.map((link) => ({
      ...link.customer,
      linkedAt: link.createdAt,
    }));

    const totalCustomers = customers.length;

    return NextResponse.json({
      customers,
      totalCustomers,
      limit: 10,
      isAtLimit: totalCustomers >= 10,
    });
  } catch (error) {
    console.error('Fetch customers error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

// POST: Add a new customer (link by email) — many-to-many
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'SHOPKEEPER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check customer limit (each shopkeeper's limit counted independently)
    const currentCount = await prisma.shopkeeperCustomer.count({
      where: { shopkeeperId: session.user.id },
    });

    if (currentCount >= 10) {
      return NextResponse.json(
        {
          error: 'Free tier limit reached. Upgrade to add more customers.',
          requiresUpgrade: true,
          currentCount,
          limit: 10,
        },
        { status: 402 }
      );
    }

    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Customer name and email are required' },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // If they're a shopkeeper themselves
      if (existingUser.role === 'SHOPKEEPER') {
        return NextResponse.json(
          { error: 'This email belongs to a shopkeeper account' },
          { status: 400 }
        );
      }

      // Check if already linked to THIS shopkeeper (prevent duplicate)
      const existingLink = await prisma.shopkeeperCustomer.findUnique({
        where: {
          shopkeeperId_customerId: {
            shopkeeperId: session.user.id,
            customerId: existingUser.id,
          },
        },
      });

      if (existingLink) {
        return NextResponse.json(
          { error: 'This customer is already linked to your account' },
          { status: 409 }
        );
      }

      // Create many-to-many link (customer may already be linked to other shopkeepers — that's fine!)
      await prisma.shopkeeperCustomer.create({
        data: {
          shopkeeperId: session.user.id,
          customerId: existingUser.id,
        },
      });

      return NextResponse.json(
        {
          message: 'Existing customer linked successfully',
          customer: {
            id: existingUser.id,
            name: existingUser.name || name,
            email: existingUser.email,
            createdAt: existingUser.createdAt,
          },
        },
        { status: 200 }
      );
    }

    // Create a placeholder customer record
    const { generateUserSalt } = await import('@/lib/encryption');
    const { hash } = await import('bcryptjs');

    const randomPassword = await hash(Math.random().toString(36) + Date.now().toString(36), 12);
    const encryptionKeySalt = generateUserSalt();

    const customer = await prisma.user.create({
      data: {
        name,
        email,
        password: randomPassword,
        role: 'CUSTOMER',
        encryptionKeySalt,
      },
    });

    // Create many-to-many link
    await prisma.shopkeeperCustomer.create({
      data: {
        shopkeeperId: session.user.id,
        customerId: customer.id,
      },
    });

    return NextResponse.json(
      {
        message: 'Customer added successfully',
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          createdAt: customer.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Add customer error:', error);
    return NextResponse.json({ error: 'Failed to add customer' }, { status: 500 });
  }
}
