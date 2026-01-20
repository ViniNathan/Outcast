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

  const { nome, idade, objetivo } = (body ?? {}) as {
    nome?: string;
    idade?: number;
    objetivo?: string;
  };

  if (!nome?.trim() || !Number.isFinite(Number(idade)) || !objetivo?.trim()) {
    return NextResponse.json(
      { error: "Nome, idade e objetivo são obrigatórios." },
      { status: 400 },
    );
  }

  const backendUrl =
    (process.env.BACKEND_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");

  const syncSecret = process.env.BACKEND_SYNC_SECRET?.trim();

  // Primeiro atualiza nome e idade no User
  const updateUserResp = await fetch(`${backendUrl}/api/user/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
    },
    body: JSON.stringify({
      authUserId: session.user.id,
      name: nome.trim(),
      age: Number(idade),
    }),
  });

  if (!updateUserResp.ok) {
    const text = await updateUserResp.text();
    return NextResponse.json(
      { error: "Falha ao atualizar usuário.", details: text },
      { status: 502 },
    );
  }

  // Depois cria/atualiza o objetivo através do endpoint /api/objective
  const objectivePayload = {
    userId: session.user.id,
    name: nome.trim(),
    age: Number(idade),
    description: objetivo.trim(),
  };

  const resp = await fetch(`${backendUrl}/api/objective`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
    },
    body: JSON.stringify(objectivePayload),
  });

  const text = await resp.text();

  if (!resp.ok) {
    return NextResponse.json(
      { error: "Backend recusou sync.", details: text },
      { status: 502 },
    );
  }

  // repassa a resposta do backend (se for JSON)
  try {
    return NextResponse.json(JSON.parse(text), { status: 200 });
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
