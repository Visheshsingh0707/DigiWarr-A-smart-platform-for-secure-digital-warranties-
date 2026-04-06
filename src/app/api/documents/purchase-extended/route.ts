import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document || document.userId !== session.user.id) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 403 });
    }

    if (document.extendedStatus !== "offered") {
      return NextResponse.json({ error: "Extended warranty is not available for this document" }, { status: 400 });
    }

    // Simulate Payment with 80% success probability
    const paymentSuccess = Math.random() < 0.8;
    if (!paymentSuccess) {
      return NextResponse.json({ error: "Payment failed. Please try again." }, { status: 402 });
    }

    // Calculate new expiry date based on the existing expiry date and extension duration
    const baseExpiry = document.expiryDate || new Date();
    const extendedWarrantyExpiry = new Date(baseExpiry);
    extendedWarrantyExpiry.setDate(extendedWarrantyExpiry.getDate() + (document.extensionDurationDays || 0));

    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        extendedStatus: "purchased",
        paymentStatus: "completed",
        extendedWarrantyExpiry,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "EXTENDED_WARRANTY_PURCHASED",
        userId: session.user.id,
        details: JSON.stringify({
          documentId,
          amountPaid: document.extendedPrice,
          newExpiry: extendedWarrantyExpiry,
        }),
      },
    });

    return NextResponse.json(updatedDocument, { status: 200 });
  } catch (error) {
    console.error("Error purchasing extended warranty:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
