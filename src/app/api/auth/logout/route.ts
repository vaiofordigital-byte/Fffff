import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { assertSameOrigin } from "@/lib/security";

export async function POST() {
  try {
    await assertSameOrigin();
    await destroySession();
    return NextResponse.json({ authenticated: false });
  } catch (error) {
    return apiError(error);
  }
}
