import { NextResponse } from "next/server";
import { getSession } from "lib/auth/server";

export async function GET() {
  const session = await getSession();
  return NextResponse.json(session || { user: null });
}

export async function POST() {
  return NextResponse.json({ success: true });
}
