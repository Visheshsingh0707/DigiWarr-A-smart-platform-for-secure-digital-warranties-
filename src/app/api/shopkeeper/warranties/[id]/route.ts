import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'SHOPKEEPER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { productName, purchaseDate, expiryDate, reason } = await req.json();

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason for edit is mandatory' }, { status: 400 });
    }

    // Fetch document and verify ownership
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Warranty not found' }, { status: 404 });
    }

    if (document.shopkeeperId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized: You did not create this warranty' }, { status: 403 });
    }

    // 1. Check Edit Count (Max 1 edit)
    if (document.editCount >= 1) {
      return NextResponse.json({ error: 'Editing is locked. Max edit limit reached. Contact admin.' }, { status: 403 });
    }

    // 2. Check Time Limit (24 Hours)
    const now = new Date();
    const createdAt = new Date(document.createdAt);
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      return NextResponse.json({ error: 'Editing is locked. 24-hour window has expired. Contact admin.' }, { status: 403 });
    }

    // Store old values for audit trail
    const oldValues = JSON.stringify({
      productName: document.productName,
      purchaseDate: document.purchaseDate,
      expiryDate: document.expiryDate,
    });

    const newValues = JSON.stringify({
      productName,
      purchaseDate: new Date(purchaseDate),
      expiryDate: new Date(expiryDate),
    });

    // Perform atomic transaction
    const updatedDocument = await prisma.$transaction(async (tx) => {
      // 1. Create Edit Log
      await tx.editLog.create({
        data: {
          documentId: id,
          shopkeeperId: session.user.id,
          oldValues,
          newValues,
          reason,
        },
      });

      // 2. Update Document
      return await tx.document.update({
        where: { id },
        data: {
          productName,
          purchaseDate: new Date(purchaseDate),
          expiryDate: new Date(expiryDate),
          title: `${productName} — Warranty`, // Sync title
          editCount: { increment: 1 },
        },
      });
    });

    return NextResponse.json({ 
      message: 'Warranty updated and audited successfully', 
      document: updatedDocument 
    });
  } catch (error: any) {
    console.error('Update warranty error:', error);
    return NextResponse.json({ error: 'Failed to update warranty' }, { status: 500 });
  }
}
