import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "Voice realtime handled natively by Hermes Gateway" });
}
