import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { missionId } = (body ?? {}) as { missionId?: string };
  if (typeof missionId !== "string" || missionId.trim().length === 0) {
    return NextResponse.json({ error: "missionId inválido." }, { status: 400 });
  }

  const backendUrl =
    (process.env.BACKEND_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
  const syncSecret = process.env.BACKEND_SYNC_SECRET?.trim();

  const resp = await fetch(`${backendUrl}/api/missions/fail`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
    },
    body: JSON.stringify({ missionId: missionId.trim() }),
  });

  const text = await resp.text();
  if (!resp.ok) {
    try {
      return NextResponse.json(JSON.parse(text), { status: resp.status });
    } catch {
      return NextResponse.json({ error: "Backend recusou.", details: text }, { status: resp.status });
    }
  }

  try {
    return NextResponse.json(JSON.parse(text), { status: resp.status });
  } catch {
    return NextResponse.json({ ok: resp.ok }, { status: resp.status });
  }
}

