import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const backendUrl =
    (process.env.BACKEND_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
  const syncSecret = process.env.BACKEND_SYNC_SECRET?.trim();

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
    // Se o usuário não existe (404), retornar 404 ao invés de 502
    // Isso é esperado para novos usuários que ainda não completaram o onboarding
    if (resp.status === 404) {
      return NextResponse.json(
        { error: "Usuário não encontrado.", needsOnboarding: true },
        { status: 404 },
      );
    }
    
    return NextResponse.json(
      { error: "Backend recusou.", details: text },
      { status: 502 },
    );
  }

  try {
    return NextResponse.json(JSON.parse(text), { status: 200 });
  } catch {
    return NextResponse.json({ error: "Resposta inválida do backend." }, { status: 502 });
  }
}

