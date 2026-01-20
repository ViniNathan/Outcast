import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
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

  const resp = await fetch(`${backendUrl}/api/missions/auto-generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
    },
    body: JSON.stringify({ playerId }),
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

