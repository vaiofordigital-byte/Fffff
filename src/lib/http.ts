import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { SecurityError } from "@/lib/security";

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(code);
    this.name = "AppError";
  }
}

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", fields: error.flatten().fieldErrors } },
      { status: 422 },
    );
  }

  if (error instanceof SecurityError) {
    const status = error.code === "RATE_LIMITED" ? 429 : 403;
    return NextResponse.json({ error: { code: error.code } }, { status });
  }

  if (error instanceof AppError) {
    return NextResponse.json({ error: { code: error.code } }, { status: error.status });
  }

  console.error("Unhandled request failure", {
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "Unknown request failure",
  });

  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR" } },
    { status: 500 },
  );
}
