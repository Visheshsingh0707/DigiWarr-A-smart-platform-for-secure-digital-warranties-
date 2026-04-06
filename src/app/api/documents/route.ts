import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteEncryptedFile } from '@/lib/storage';

// GET all documents for current user (includes shopkeeper info for customer dashboard)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await prisma.document.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        type: true,
        productName: true,
        provider: true,
        purchaseDate: true,
        expiryDate: true,
        renewalDate: true,
        amount: true,
        originalName: true,
        mimeType: true,
        fileSize: true,
        createdByShopkeeper: true,
        shopkeeperId: true,
        createdAt: true,
        updatedAt: true,
        editCount: true,
        // Include shopkeeper details if the document was created by a shopkeeper
        shopkeeper: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Also fetch linked shopkeepers for filter dropdown
    const linkedShopkeepers = await prisma.shopkeeperCustomer.findMany({
      where: { customerId: session.user.id },
      include: {
        shopkeeper: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const shopkeepers = linkedShopkeepers.map((l) => l.shopkeeper);

    return NextResponse.json({ documents, shopkeepers });
  } catch (error) {
    console.error('Fetch documents error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// DELETE a document
export async function DELETE(req: NextRequest) {
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

    // Verify ownership
    const document = await prisma.document.findFirst({
      where: { id: docId, userId: session.user.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete encrypted file from storage
    await deleteEncryptedFile(document.storagePath);

    // Delete from database
    await prisma.document.delete({ where: { id: docId } });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
