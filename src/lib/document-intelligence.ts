import { extractText } from "unpdf";
import mammoth from "mammoth";
import { AppError } from "@/lib/http";
import { sha256 } from "@/lib/security";

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const MAX_EXTRACTED_CHARACTERS = 250_000;

const supportedTypes = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function extractBusinessDocument(file: File) {
  if (!supportedTypes.has(file.type)) {
    throw new AppError("DOCUMENT_TYPE_UNSUPPORTED", 415);
  }
  if (file.size <= 0 || file.size > MAX_DOCUMENT_BYTES) {
    throw new AppError("DOCUMENT_SIZE_INVALID", 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let text: string;
  if (file.type === "application/pdf") {
    const result = await extractText(new Uint8Array(buffer), { mergePages: true });
    text = result.text;
  } else if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  } else {
    text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  }

  const normalized = text
    .normalize("NFKC")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
  if (normalized.length < 10) {
    throw new AppError("DOCUMENT_TEXT_EMPTY", 422);
  }

  return {
    filename: file.name.slice(0, 255),
    mimeType: file.type,
    sizeBytes: file.size,
    checksum: sha256(buffer.toString("base64")),
    text: normalized.slice(0, MAX_EXTRACTED_CHARACTERS),
    truncated: normalized.length > MAX_EXTRACTED_CHARACTERS,
    source:
      file.type === "application/pdf"
        ? ("PDF" as const)
        : file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ? ("DOCUMENT" as const)
          : ("TEXT" as const),
  };
}
