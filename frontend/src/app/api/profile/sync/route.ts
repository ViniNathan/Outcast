import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("[SYNC] POST /api/profile/sync iniciado");
  
  const session = await getServerSession(authOptions);
  console.log("[SYNC] Session user ID:", session?.user?.id);

  if (!session?.user?.id) {
    console.log("[SYNC] ❌ Não autenticado");
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
    console.log("[SYNC] Body recebido:", JSON.stringify(body));
  } catch {
    console.log("[SYNC] ❌ Body inválido");
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { nome, idade, objetivo } = (body ?? {}) as {
    nome?: string;
    idade?: number;
    objetivo?: string;
  };

  console.log("[SYNC] Nome:", nome);
  console.log("[SYNC] Idade:", idade);
  console.log("[SYNC] Objetivo:", objetivo);

  if (!nome?.trim() || !Number.isFinite(Number(idade)) || !objetivo?.trim()) {
    console.log("[SYNC] ❌ Validação falhou");
    return NextResponse.json(
      { error: "Nome, idade e objetivo são obrigatórios." },
      { status: 400 },
    );
  }

  const backendUrl =
    (process.env.BACKEND_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");

  const syncSecret = process.env.BACKEND_SYNC_SECRET?.trim();

  console.log("[SYNC] Backend URL:", backendUrl);
  console.log("[SYNC] Sync Secret exists:", !!syncSecret);
  console.log("[SYNC] Sync Secret length:", syncSecret?.length || 0);

  // Primeiro atualiza nome e idade no User
  console.log("[SYNC] Atualizando dados do usuário...");
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

  console.log("[SYNC] Status atualização user:", updateUserResp.status);

  if (!updateUserResp.ok) {
    const text = await updateUserResp.text();
    console.log("[SYNC] ❌ Erro ao atualizar user:", text);
    return NextResponse.json(
      { error: "Falha ao atualizar usuário.", details: text },
      { status: 502 },
    );
  }

  console.log("[SYNC] ✅ Usuário atualizado");

  // Depois cria/atualiza o objetivo através do endpoint /api/objective
  console.log("[SYNC] Criando/atualizando objetivo...");
  const objectivePayload = {
    userId: session.user.id,
    name: nome.trim(),
    age: Number(idade),
    description: objetivo.trim(),
  };
  console.log("[SYNC] Payload objetivo:", JSON.stringify(objectivePayload));

  const resp = await fetch(`${backendUrl}/api/objective`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
    },
    body: JSON.stringify(objectivePayload),
  });

  console.log("[SYNC] Status objetivo:", resp.status);
  const text = await resp.text();
  console.log("[SYNC] Resposta objetivo:", text);

  if (!resp.ok) {
    console.log("[SYNC] ❌ Backend recusou sync");
    return NextResponse.json(
      { error: "Backend recusou sync.", details: text },
      { status: 502 },
    );
  }

  console.log("[SYNC] ✅ Sync completo com sucesso");

  // repassa a resposta do backend (se for JSON)
  try {
    return NextResponse.json(JSON.parse(text), { status: 200 });
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}

