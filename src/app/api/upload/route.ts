import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptBuffer, deriveUserKey, getMasterKey } from '@/lib/encryption';
import { saveEncryptedFile } from '@/lib/storage';
import { extractDocumentData } from '@/lib/parser';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const docType = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Perform OCR on the raw buffer (in memory, before encryption)
    let ocrText = '';
    let extractedData = {
      productName: null as string | null,
      provider: null as string | null,
      purchaseDate: null as Date | null,
      expiryDate: null as Date | null,
      renewalDate: null as Date | null,
      amount: null as string | null,
      type: (docType || 'WARRANTY') as 'WARRANTY' | 'INVOICE' | 'POLICY',
    };

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

    // Use provided type or detected type
    const finalType = docType || extractedData.type;

    // Save metadata to database
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        title: title || extractedData.productName || file.name,
        type: finalType,
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
        ocrText: ocrText.substring(0, 5000), // Store limited OCR text
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
