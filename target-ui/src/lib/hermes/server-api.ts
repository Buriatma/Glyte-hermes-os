/**
 * Server-side Hermes API helper
 * Connects Next.js API routes to the Hermes Gateway / Dashboard HTTP endpoints
 */

export function getHermesHttpBaseUrl(): string {
  const wsUrl = process.env.HERMES_GATEWAY_URL || process.env.NEXT_PUBLIC_HERMES_GATEWAY_URL || "ws://localhost:9119";
  let httpUrl = wsUrl.replace(/^ws:\/\//i, "http://").replace(/^wss:\/\//i, "https://");
  // Remove /api/ws suffix if present
  httpUrl = httpUrl.replace(/\/api\/ws\/?$/i, "");
  return httpUrl;
}

export async function forwardHermesRequest(path: string, options: RequestInit = {}): Promise<Response> {
  const baseUrl = getHermesHttpBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  
  const headers = new Headers(options.headers);
  const password = process.env.HERMES_WEBUI_PASSWORD;
  if (password && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${password}`);
  }

  try {
    return await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    console.warn(`Failed to forward request to Hermes at ${url}:`, err.message);
    return new Response(JSON.stringify({ error: err.message, url }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
