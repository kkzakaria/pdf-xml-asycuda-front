import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true },
    });
    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
