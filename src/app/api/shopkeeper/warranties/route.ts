import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encryptBuffer, deriveUserKey, getMasterKey } from '@/lib/encryption';
import { saveEncryptedFile } from '@/lib/storage';

// POST: Create a warranty for a customer
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'SHOPKEEPER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const customerId = formData.get('customerId') as string;
    const productName = formData.get('productName') as string;
    const purchaseDate = formData.get('purchaseDate') as string;
    const expiryDate = formData.get('expiryDate') as string;
    const file = formData.get('file') as File | null;

    if (!customerId || !productName || !purchaseDate || !expiryDate) {
      return NextResponse.json(
        { error: 'Customer, product name, purchase date, and expiry date are required' },
        { status: 400 }
      );
    }

    // Verify customer is linked to this shopkeeper via junction table
    const link = await prisma.shopkeeperCustomer.findUnique({
      where: {
        shopkeeperId_customerId: {
          shopkeeperId: session.user.id,
          customerId,
        },
      },
      include: { customer: true },
    });

    if (!link) {
      return NextResponse.json({ error: 'Customer not found or not linked to your account' }, { status: 404 });
    }

    const customer = link.customer;

    let storagePath = '';
    let originalName = 'warranty-record';
    let mimeType = 'text/plain';
    let fileSize = 0;
    let iv = '';
    let authTag = '';
    let ocrText = '';

    if (file) {
      // Process file upload with encryption
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Encrypt with customer's key
      const masterKey = getMasterKey();
      const userKey = deriveUserKey(masterKey, customer.encryptionKeySalt);
      const encrypted = encryptBuffer(buffer, userKey);

      storagePath = await saveEncryptedFile(encrypted.encrypted, file.name);
      originalName = file.name;
      mimeType = file.type;
      fileSize = buffer.length;
      iv = encrypted.iv;
      authTag = encrypted.authTag;
    } else {
      // Create a detailed text file receipt placeholder
      const masterKey = getMasterKey();
      const userKey = deriveUserKey(masterKey, customer.encryptionKeySalt);
      
      const receiptText = `DIGIWARR DIGITAL WARRANTY RECEIPT\r
=========================================\r
Product Name: ${productName}\r
Customer Name: ${customer.name || customer.email}\r
Customer Email: ${customer.email}\r
Purchase Date: ${new Date(purchaseDate).toLocaleDateString()}\r
Expiry Date: ${new Date(expiryDate).toLocaleDateString()}\r
Provider/Shopkeeper: ${session.user.name || session.user.email}\r
\r
This document is a securely encrypted placeholder verifying the parameters of this warranty tracking record on the DigiWarr platform. All edits are permanently audited.\r
=========================================\r
Generated At: ${new Date().toISOString()}`;

      const placeholder = Buffer.from(receiptText);
      const encrypted = encryptBuffer(placeholder, userKey);
      storagePath = await saveEncryptedFile(encrypted.encrypted, 'warranty.txt');
      originalName = 'warranty-record.txt';
      mimeType = 'text/plain';
      fileSize = placeholder.length;
      iv = encrypted.iv;
      authTag = encrypted.authTag;
    }

    const document = await prisma.document.create({
      data: {
        userId: customer.id,
        shopkeeperId: session.user.id, // Track which shopkeeper created this
        title: `${productName} — Warranty`,
        type: 'WARRANTY',
        productName,
        provider: session.user.name || 'Shopkeeper',
        purchaseDate: new Date(purchaseDate),
        expiryDate: new Date(expiryDate),
        storagePath,
        originalName,
        mimeType,
        fileSize,
        iv,
        authTag,
        ocrText: ocrText.substring(0, 5000),
        createdByShopkeeper: true,
      },
    });

    return NextResponse.json(
      { message: 'Warranty created successfully', document },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create warranty error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to create warranty' }, { status: 500 });
  }
}

// GET: List all warranties created by this shopkeeper
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'SHOPKEEPER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all customer IDs linked to this shopkeeper via junction table
    const links = await prisma.shopkeeperCustomer.findMany({
      where: { shopkeeperId: session.user.id },
      select: { customerId: true },
    });

    const customerIds = links.map((l) => l.customerId);

    const warranties = await prisma.document.findMany({
      where: {
        userId: { in: customerIds },
        createdByShopkeeper: true,
        shopkeeperId: session.user.id,
        type: 'WARRANTY',
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ warranties });
  } catch (error) {
    console.error('Fetch warranties error:', error);
    return NextResponse.json({ error: 'Failed to fetch warranties' }, { status: 500 });
  }
}
