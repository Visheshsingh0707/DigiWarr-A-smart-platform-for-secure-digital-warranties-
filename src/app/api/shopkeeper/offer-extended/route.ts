import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SHOPKEEPER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { documentId, extendedPrice, extensionDurationDays } = body;

    if (!documentId || extendedPrice == null || extensionDurationDays == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify shopkeeper owns the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document || document.shopkeeperId !== session.user.id) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 403 });
    }

    if (document.extendedStatus === "purchased") {
      return NextResponse.json({ error: "Extended warranty already purchased" }, { status: 400 });
    }

    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        isExtendedOffered: true,
        extendedPrice: Number(extendedPrice),
        extensionDurationDays: Number(extensionDurationDays),
        extendedStatus: "offered",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "EXTENDED_WARRANTY_OFFERED",
        userId: session.user.id,
        details: JSON.stringify({
          documentId,
          extendedPrice,
          extensionDurationDays,
        }),
      },
    });

    return NextResponse.json(updatedDocument, { status: 200 });
  } catch (error) {
    console.error("Error offering extended warranty:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
