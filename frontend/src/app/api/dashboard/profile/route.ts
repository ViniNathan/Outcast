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

  const { name, age, objective, playerId } = (body ?? {}) as { 
    name?: string; 
    age?: number; 
    objective?: string;
    playerId?: string;
  };
  const hasName = typeof name === "string" && name.trim().length > 0;
  const hasAge = Number.isFinite(Number(age)) && Number(age) > 0;
  const hasObjective = typeof objective === "string" && objective.trim().length > 0;

  if (!hasName && !hasAge && !hasObjective) {
    return NextResponse.json(
      { error: "Nada para atualizar." },
      { status: 400 },
    );
  }

  const backendUrl =
    (process.env.BACKEND_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
  const syncSecret = process.env.BACKEND_SYNC_SECRET?.trim();

  const results: { user?: unknown; objective?: unknown } = {};

  // Atualiza usuário (nome/idade) se necessário
  if (hasName || hasAge) {
    const resp = await fetch(`${backendUrl}/api/user/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
      },
      body: JSON.stringify({
        authUserId: session.user.id,
        ...(hasName ? { name: name!.trim() } : {}),
        ...(hasAge ? { age: Number(age) } : {}),
      }),
    });

    const text = await resp.text();
    if (!resp.ok) {
      let errorMessage = "Falha ao atualizar usuário.";
      try {
        const parsed = JSON.parse(text) as { error?: string };
        if (parsed?.error) errorMessage = parsed.error;
      } catch {
        // ignore
      }
      return NextResponse.json(
        { error: errorMessage, details: text },
        { status: 502 },
      );
    }

    try {
      results.user = JSON.parse(text);
    } catch {
      results.user = { ok: true };
    }
  }

  // Atualiza objetivo se necessário
  if (hasObjective && playerId) {
    const resp = await fetch(`${backendUrl}/api/objective/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
      },
      body: JSON.stringify({
        playerId,
        description: objective!.trim(),
      }),
    });

    const text = await resp.text();
    if (!resp.ok) {
      let errorMessage = "Falha ao atualizar objetivo.";
      try {
        const parsed = JSON.parse(text) as { error?: string };
        if (parsed?.error) errorMessage = parsed.error;
      } catch {
        // ignore
      }
      return NextResponse.json(
        { error: errorMessage, details: text },
        { status: 502 },
      );
    }

    try {
      results.objective = JSON.parse(text);
    } catch {
      results.objective = { ok: true };
    }
  }

  return NextResponse.json(results, { status: 200 });
}

