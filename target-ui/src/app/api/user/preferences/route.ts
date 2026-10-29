import { getSession } from "auth/server";
import { UserPreferencesZodSchema } from "app-types/user";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({
      displayName: "Hermes Operator",
      botName: "Hermes Agent",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get preferences" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const json = await request.json();
    const preferences = UserPreferencesZodSchema.parse(json);
    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update preferences" },
      { status: 500 },
    );
  }
}
