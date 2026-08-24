import { describe, expect, it } from "vitest";
import { scoreBusinessOutput } from "@/lib/output-quality";

describe("business output quality indicator", () => {
  it("scores a structured actionable report above a vague sentence", () => {
    const vague = scoreBusinessOutput("Increase sales.");
    const structured = scoreBusinessOutput(`
## Executive summary
The available customer and product evidence indicates two opportunities.

## Assumptions and data gaps
- No channel conversion data was supplied.
- Delivery policy is approved, but margin data is missing.

## Prioritized actions
1. Test a product-benefit landing message with one audience segment.
2. Measure conversion and acquisition cost before increasing spend.
3. Review the test after seven days.

## Risks and next steps
Document the missing margin constraint and assign an owner to each action.
`);

    expect(structured.total).toBeGreaterThan(vague.total);
    expect(structured.dimensions.actionability).toBeGreaterThan(10);
    expect(structured.dimensions.evidenceDiscipline).toBeGreaterThan(10);
  });

  it("never reports a score outside the 0-100 range", () => {
    const result = scoreBusinessOutput("# Report\n" + "- Action\n".repeat(200));
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.disclaimer).toContain("not a scientific measure");
  });
});
