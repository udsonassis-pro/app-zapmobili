import { requireAnyRole } from "@/server/auth/session";
import {
  listDriverDocuments,
  submitDriverDocument,
} from "@/server/drivers/documents";
import { submitDriverDocumentSchema } from "@/server/drivers/document-schemas";

export async function GET() {
  const session = await requireAnyRole(["DRIVER"]);
  const result = await listDriverDocuments(session.sub);

  return Response.json({
    documents: result.documents.map((document) => ({
      id: document.id,
      type: document.type,
      fileUrl: document.fileUrl,
      status: document.status,
      reviewNote: document.reviewNote,
      createdAt: document.createdAt,
      reviewedAt: document.reviewedAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireAnyRole(["DRIVER"]);
  const body = await request.json();
  const parsed = submitDriverDocumentSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Dados invalidos para enviar documento." },
      { status: 400 },
    );
  }

  try {
    const document = await submitDriverDocument(session.sub, parsed.data);

    return Response.json(
      {
        document: {
          id: document.id,
          type: document.type,
          fileUrl: document.fileUrl,
          status: document.status,
          createdAt: document.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel enviar documento.",
      },
      { status: 400 },
    );
  }
}
