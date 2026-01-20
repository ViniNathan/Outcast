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

  const { message } = (body ?? {}) as { message?: string };
  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Mensagem inválida." }, { status: 400 });
  }

  const backendUrl =
    (process.env.BACKEND_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
  const syncSecret = process.env.BACKEND_SYNC_SECRET?.trim();

  const meUrl = new URL(`${backendUrl}/api/me`);
  meUrl.searchParams.set("authUserId", session.user.id);

  const meResp = await fetch(meUrl.toString(), {
    headers: {
      ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
    },
    cache: "no-store",
  });

  const meText = await meResp.text();
  if (!meResp.ok) {
    return NextResponse.json({ error: "Backend recusou.", details: meText }, { status: meResp.status });
  }

  let playerId: string | undefined;
  try {
    const me = JSON.parse(meText) as { player?: { id?: string } };
    playerId = me?.player?.id;
  } catch {
    // ignore
  }

  if (!playerId) {
    return NextResponse.json({ error: "PlayerId não encontrado." }, { status: 502 });
  }

  const resp = await fetch(`${backendUrl}/api/missions/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
    },
    body: JSON.stringify({ playerId, message: message.trim() }),
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

