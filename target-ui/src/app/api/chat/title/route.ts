import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const message = json.message || "Hermes Session";
    const title = message.slice(0, 30);
    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({ title: "Hermes Session" });
  }
}
