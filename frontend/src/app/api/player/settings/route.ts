import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

async function getBackendPlayerId() {
  const backendUrl =
    (process.env.BACKEND_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
  const syncSecret = process.env.BACKEND_SYNC_SECRET?.trim();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }

  const url = new URL(`${backendUrl}/api/me`);
  url.searchParams.set("authUserId", session.user.id);

  const resp = await fetch(url.toString(), {
    headers: {
      ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
    },
    cache: "no-store",
  });

  const text = await resp.text();
  if (!resp.ok) {
    return {
      error: NextResponse.json({ error: "Backend recusou.", details: text }, { status: resp.status }),
    };
  }

  try {
    const me = JSON.parse(text) as { player?: { id?: string } };
    const playerId = me?.player?.id;
    if (!playerId) {
      return { error: NextResponse.json({ error: "PlayerId não encontrado." }, { status: 502 }) };
    }
    return { backendUrl, syncSecret, playerId };
  } catch {
    return { error: NextResponse.json({ error: "Resposta inválida do backend." }, { status: 502 }) };
  }
}

export async function POST(req: Request) {
  const resolved = await getBackendPlayerId();
  if ("error" in resolved) return resolved.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { autoMissionGeneration } = (body ?? {}) as { autoMissionGeneration?: boolean };
  if (typeof autoMissionGeneration !== "boolean") {
    return NextResponse.json({ error: "autoMissionGeneration inválido." }, { status: 400 });
  }

  const resp = await fetch(`${resolved.backendUrl}/api/player/settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(resolved.syncSecret ? { "x-sync-secret": resolved.syncSecret } : {}),
    },
    body: JSON.stringify({
      playerId: resolved.playerId,
      autoMissionGeneration,
    }),
  });

  const text = await resp.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: resp.status });
  } catch {
    return NextResponse.json({ ok: resp.ok, details: text }, { status: resp.status });
  }
}

