import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("[FRONTEND STRIPE CHECKOUT] Requisição recebida");
    const session = await getServerSession(authOptions);
    console.log("[FRONTEND STRIPE CHECKOUT] Session:", session?.user?.id ? "OK" : "NÃO AUTENTICADO");
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    // Buscar o priceId do .env do servidor (não do cliente)
    const priceId = process.env.STRIPE_PRICE_ID;
    
    console.log("[FRONTEND STRIPE CHECKOUT] PriceId do servidor:", priceId);

    if (!priceId) {
      console.error("[FRONTEND STRIPE CHECKOUT] STRIPE_PRICE_ID não está configurado no .env!");
      return NextResponse.json({ error: "Price ID não configurado." }, { status: 500 });
    }

    // Chamar o backend para criar a sessão de checkout
    const backendUrl = (process.env.BACKEND_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
    const syncSecret = process.env.BACKEND_SYNC_SECRET?.trim();

    const requestBody = {
      priceId,
      authUserId: session.user.id,
      customerEmail: session.user.email || undefined,
      origin: req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || undefined,
    };

    console.log("[STRIPE CHECKOUT] Enviando para backend:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${backendUrl}/api/stripe/create-checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
      },
      body: JSON.stringify(requestBody),
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
