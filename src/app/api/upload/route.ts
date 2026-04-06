import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptBuffer, deriveUserKey, getMasterKey } from '@/lib/encryption';
import { saveEncryptedFile } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read form fields
    const title = formData.get('title') as string;
    const docType = formData.get('type') as string;
    const productName = formData.get('productName') as string || null;
    const provider = formData.get('provider') as string || null;
    const amount = formData.get('amount') as string || null;

    // Helper to parse dates strictly
    const parseDateStr = (dateStr: string | null) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    const purchaseDateStr = formData.get('purchaseDate') as string | null;
    const expiryDateStr = formData.get('expiryDate') as string | null;
    const renewalDateStr = formData.get('renewalDate') as string | null;

    const extractedData = {
      productName,
      provider,
      purchaseDate: parseDateStr(purchaseDateStr),
      expiryDate: parseDateStr(expiryDateStr),
      renewalDate: parseDateStr(renewalDateStr),
      amount,
      type: (docType || 'WARRANTY') as 'WARRANTY' | 'INVOICE' | 'POLICY',
    };

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get user's encryption key
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { encryptionKeySalt: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found for encryption' }, { status: 404 });
    }

    let masterKey;
    try {
      masterKey = getMasterKey();
    } catch(err) {
      console.error('Missing Master Key Configuration', err);
      return NextResponse.json({ error: 'Server configuration error: Master key missing.' }, { status: 500 });
    }
    
    const userKey = deriveUserKey(masterKey, user.encryptionKeySalt);

    // Encrypt the file
    const { encrypted, iv, authTag } = encryptBuffer(buffer, userKey);

    // Save encrypted file to storage
    const storagePath = await saveEncryptedFile(encrypted, file.name);

    // Save metadata to database
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        title: title || extractedData.productName || file.name,
        type: extractedData.type,
        productName: extractedData.productName,
        provider: extractedData.provider,
        purchaseDate: extractedData.purchaseDate,
        expiryDate: extractedData.expiryDate,
        renewalDate: extractedData.renewalDate,
        amount: extractedData.amount,
        storagePath,
        originalName: file.name,
        mimeType: file.type,
        fileSize: buffer.length,
        iv,
        authTag,
        ocrText: 'Parsed via client-side OCR successfully.', // Placeholder
      },
    });

    return NextResponse.json(
      {
        message: 'Document uploaded and encrypted successfully',
        document: {
          id: document.id,
          title: document.title,
          type: document.type,
          productName: document.productName,
          provider: document.provider,
          purchaseDate: document.purchaseDate,
          expiryDate: document.expiryDate,
          extractedData,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Upload Error Details:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to upload document. Please try again.' },
      { status: 500 }
    );
  }
}
