import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  const expectedPassword = process.env.HERMES_WEBUI_PASSWORD;

  // If no password configured, grant operator access automatically
  if (!expectedPassword) {
    return NextResponse.next();
  }

  const token = request.cookies.get("hermes_auth_token")?.value;

  if (token !== expectedPassword) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth|sign-in|sign-up).*)",
  ],
};
