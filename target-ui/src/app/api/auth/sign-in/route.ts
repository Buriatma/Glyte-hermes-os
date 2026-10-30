import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const expectedPassword = process.env.HERMES_WEBUI_PASSWORD;

    if (expectedPassword && password !== expectedPassword) {
      return NextResponse.json({ message: "Invalid password for Hermes OS" }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set("hermes_auth_token", password || "operator", {
      httpOnly: true,
      secure: false, // ponytail: HTTP on VPS; add TLS/Cloudflare tunnel to re-enable Secure cookies
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Sign in failed" }, { status: 500 });
  }
}
