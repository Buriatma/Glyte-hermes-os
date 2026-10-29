import { NextResponse } from "next/server";
import { forwardHermesRequest } from "@/lib/hermes/server-api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const res = await forwardHermesRequest(`/api/cron/jobs/${id}/trigger`, {
      method: "POST",
    });
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch (_) {}

  return NextResponse.json({ ok: true, triggered: id });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const res = await forwardHermesRequest(`/api/cron/jobs/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
  } catch (_) {}

  return NextResponse.json({ ok: true, deleted: id });
}
