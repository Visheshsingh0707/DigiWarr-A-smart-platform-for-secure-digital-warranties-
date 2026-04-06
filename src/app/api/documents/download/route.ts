import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decryptBuffer, deriveUserKey, getMasterKey } from '@/lib/encryption';
import { readEncryptedFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

    // Fetch document with ownership check (owner OR creator)
    const document = await prisma.document.findFirst({
      where: {
        id: docId,
        OR: [
          { userId: session.user.id },
          { shopkeeperId: session.user.id }
        ]
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Get document owner's encryption key (always decrypt with the owner's salt)
    const owner = await prisma.user.findUnique({
      where: { id: document.userId },
      select: { encryptionKeySalt: true },
    });

    if (!owner) {
      return NextResponse.json({ error: 'Owner not found' }, { status: 404 });
    }

    // Decrypt
    const masterKey = getMasterKey();
    const userKey = deriveUserKey(masterKey, owner.encryptionKeySalt);
    const encryptedBuffer = await readEncryptedFile(document.storagePath);
    const decryptedBuffer = decryptBuffer(
      encryptedBuffer,
      userKey,
      document.iv,
      document.authTag
    );

    // Return the decrypted file
    return new NextResponse(new Uint8Array(decryptedBuffer), {
      headers: {
        'Content-Type': document.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(document.originalName)}"`,
        'Content-Length': decryptedBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    );
  }
}
