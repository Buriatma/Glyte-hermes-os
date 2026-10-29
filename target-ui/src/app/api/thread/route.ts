import { getSession } from "auth/server";

export async function GET() {
  const session = await getSession();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  return Response.json([]);
}
