import { NextResponse } from "next/server";
import { z } from "zod";
import { executeGeneration } from "@/lib/ai/generation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, AppError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  input: z.record(z.string(), z.string().max(5_000)).default({}),
  locale: z.enum(["ar", "en"]).default("ar"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string; stepRunId: string }> },
) {
  const { runId, stepRunId } = await params;
  try {
    await assertSameOrigin();
    const user = await getCurrentUser();
    if (!user) throw new AppError("AUTHENTICATION_REQUIRED", 401);
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey || idempotencyKey.length < 12 || idempotencyKey.length > 120) {
      throw new AppError("IDEMPOTENCY_KEY_REQUIRED", 400);
    }
    const input = schema.parse(await request.json());
    const run = await db.workflowRun.findFirst({
      where: { id: runId, userId: user.id },
      include: {
        steps: {
          include: { workflowStep: true },
          orderBy: { workflowStep: { sortOrder: "asc" } },
        },
      },
    });
    if (!run) throw new AppError("WORKFLOW_RUN_NOT_FOUND", 404);
    const index = run.steps.findIndex((step) => step.id === stepRunId);
    if (index < 0) throw new AppError("WORKFLOW_STEP_NOT_FOUND", 404);
    const target = run.steps[index];
    if (run.steps.slice(0, index).some((step) => step.status !== "COMPLETED")) {
      throw new AppError("PREVIOUS_STEP_REQUIRED", 409);
    }

    const instructions = target.workflowStep.instructions as {
      prompt?: string;
      system?: string;
    };
    const previousOutputs = run.steps
      .slice(0, index)
      .map((step) => step.output)
      .filter(Boolean);
    const executionPrompt = [
      instructions.prompt ?? JSON.stringify(instructions),
      `WORKFLOW CONTEXT:\n${JSON.stringify(run.context)}`,
      `STEP INPUT:\n${JSON.stringify(input.input)}`,
      previousOutputs.length
        ? `PREVIOUS OUTPUTS:\n${JSON.stringify(previousOutputs)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    await db.$transaction([
      db.workflowRun.update({
        where: { id: run.id },
        data: { status: "RUNNING", currentStep: index, startedAt: run.startedAt ?? new Date() },
      }),
      db.workflowStepRun.update({
        where: { id: target.id },
        data: { status: "RUNNING", input: input.input, startedAt: new Date() },
      }),
    ]);

    try {
      const generation = await executeGeneration({
        userId: user.id,
        prompt: executionPrompt,
        locale: input.locale,
        projectId: run.projectId ?? undefined,
        creditCost: target.workflowStep.creditCost,
        idempotencyKey: `workflow:${run.id}:${target.id}:${idempotencyKey}`,
      });
      const last = index === run.steps.length - 1;

      await db.$transaction([
        db.workflowStepRun.update({
          where: { id: target.id },
          data: {
            status: "COMPLETED",
            output: { content: generation.content },
            generatedPromptId: generation.id,
            creditCost: target.workflowStep.creditCost,
            completedAt: new Date(),
          },
        }),
        db.workflowRun.update({
          where: { id: run.id },
          data: {
            status: last ? "COMPLETED" : "RUNNING",
            currentStep: last ? index + 1 : index,
            completedAt: last ? new Date() : null,
          },
        }),
      ]);

      return NextResponse.json({
        completed: true,
        output: generation.content,
        creditBalance: generation.creditBalance,
      });
    } catch (error) {
      await db.workflowStepRun.update({
        where: { id: target.id },
        data: { status: "FAILED" },
      });
      throw error;
    }
  } catch (error) {
    return apiError(error);
  }
}
