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

  const { name, age } = (body ?? {}) as { name?: string; age?: number };
  const hasName = typeof name === "string" && name.trim().length > 0;
  const hasAge = Number.isFinite(Number(age)) && Number(age) > 0;

  if (!hasName && !hasAge) {
    return NextResponse.json(
      { error: "Nada para atualizar." },
      { status: 400 },
    );
  }

  const backendUrl =
    (process.env.BACKEND_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
  const syncSecret = process.env.BACKEND_SYNC_SECRET?.trim();

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
    return NextResponse.json(
      { error: "Backend recusou.", details: text },
      { status: 502 },
    );
  }

  try {
    return NextResponse.json(JSON.parse(text), { status: 200 });
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

