import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { extractBusinessDocument } from "@/lib/document-intelligence";
import { apiError, AppError } from "@/lib/http";
import { requireOrganizationMembership } from "@/lib/organizations";
import { assertSameOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const form = await request.formData();
    const organizationId = form.get("organizationId");
    const file = form.get("file");
    const privateMode = form.get("privateMode") === "true";
    if (typeof organizationId !== "string") {
      throw new AppError("ORGANIZATION_REQUIRED", 422);
    }
    if (!(file instanceof File)) throw new AppError("DOCUMENT_REQUIRED", 422);
    await requireOrganizationMembership(user.id, organizationId, "EMPLOYEE");
    const extracted = await extractBusinessDocument(file);

    const existing = await db.knowledgeDocument.findUnique({
      where: {
        organizationId_checksum: {
          organizationId,
          checksum: extracted.checksum,
        },
      },
      select: { id: true, status: true },
    });
    if (existing) {
      return NextResponse.json({ ...existing, duplicate: true });
    }

    const result = await db.$transaction(async (tx) => {
      const document = await tx.knowledgeDocument.create({
        data: {
          organizationId,
          uploadedById: user.id,
          filename: extracted.filename,
          mimeType: extracted.mimeType,
          sizeBytes: extracted.sizeBytes,
          checksum: extracted.checksum,
          source: extracted.source,
          status: "READY",
          extractedText: privateMode ? null : extracted.text,
        },
      });
      const entry = await tx.knowledgeEntry.create({
        data: {
          organizationId,
          documentId: document.id,
          createdById: user.id,
          kind: "DOCUMENT",
          source: extracted.source,
          titleAr: extracted.filename,
          titleEn: extracted.filename,
          content: extracted.text,
          approved: true,
          privateMode,
          metadata: {
            truncated: extracted.truncated,
            mimeType: extracted.mimeType,
          },
        },
      });
      return { document, entry };
    });

    return NextResponse.json(
      {
        id: result.document.id,
        entryId: result.entry.id,
        status: result.document.status,
        filename: result.document.filename,
        truncated: extracted.truncated,
        duplicate: false,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
