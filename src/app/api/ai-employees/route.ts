import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";

export async function GET() {
  try {
    const employees = await db.aiEmployee.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        type: true,
        nameAr: true,
        nameEn: true,
        purposeAr: true,
        purposeEn: true,
        descriptionAr: true,
        descriptionEn: true,
        capabilities: true,
        actions: true,
        requiredKnowledge: true,
        defaultCreditCost: true,
      },
    });
    return NextResponse.json(employees, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
    });
  } catch (error) {
    return apiError(error);
  }
}
