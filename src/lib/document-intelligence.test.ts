import { describe, expect, it } from "vitest";
import { extractBusinessDocument } from "@/lib/document-intelligence";

describe("document intelligence", () => {
  it("extracts and normalizes approved plain-text company knowledge", async () => {
    const file = new File(
      ["Company policy\u0000\n\n\n\nDelivery takes two business days.  "],
      "policy.txt",
      { type: "text/plain" },
    );
    const result = await extractBusinessDocument(file);

    expect(result.filename).toBe("policy.txt");
    expect(result.source).toBe("TEXT");
    expect(result.text).toContain("Delivery takes two business days.");
    expect(result.text).not.toContain("\u0000");
    expect(result.checksum).toHaveLength(64);
  });

  it("rejects executable and unsupported uploads", async () => {
    const file = new File(["not allowed"], "payload.exe", {
      type: "application/octet-stream",
    });
    await expect(extractBusinessDocument(file)).rejects.toMatchObject({
      code: "DOCUMENT_TYPE_UNSUPPORTED",
    });
  });
});
