import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = await req.json();
    const { priceId } = body;

    if (!priceId) {
      return NextResponse.json({ error: "Price ID é obrigatório." }, { status: 400 });
    }

    // Chamar o backend para criar a sessão de checkout
    const backendUrl = (process.env.BACKEND_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
    const syncSecret = process.env.BACKEND_SYNC_SECRET?.trim();

    const response = await fetch(`${backendUrl}/api/stripe/create-checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
      },
      body: JSON.stringify({
        priceId,
        authUserId: session.user.id,
        customerEmail: session.user.email || undefined,
        origin: req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
      console.error("[STRIPE CHECKOUT ERROR] Backend error:", errorData);
      return NextResponse.json(
        { error: errorData.error || "Erro ao criar sessão de checkout." },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ sessionId: data.sessionId, url: data.url });
  } catch (error) {
    console.error("[STRIPE CHECKOUT ERROR]", error);
    return NextResponse.json(
      { error: "Erro ao criar sessão de checkout." },
      { status: 500 }
    );
  }
}
