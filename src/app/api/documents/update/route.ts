import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH - update document metadata
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('id');

    if (!docId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    const body = await req.json();

    // Verify ownership
    const document = await prisma.document.findFirst({
      where: { id: docId, userId: session.user.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const updated = await prisma.document.update({
      where: { id: docId },
      data: {
        title: body.title ?? document.title,
        type: body.type ?? document.type,
        productName: body.productName ?? document.productName,
        provider: body.provider ?? document.provider,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : document.purchaseDate,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : document.expiryDate,
        renewalDate: body.renewalDate ? new Date(body.renewalDate) : document.renewalDate,
        amount: body.amount ?? document.amount,
      },
    });

    return NextResponse.json({ document: updated });
  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}
