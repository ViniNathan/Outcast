import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Encaminhar o webhook para o backend
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente." }, { status: 400 });
  }

  const backendUrl = (process.env.BACKEND_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
  const syncSecret = process.env.BACKEND_SYNC_SECRET?.trim();

  try {
    const response = await fetch(`${backendUrl}/api/stripe/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "stripe-signature": signature,
        ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
      },
      body,
    });

    const data = await response.json().catch(() => ({ error: "Erro desconhecido" }));

    if (!response.ok) {
      console.error("[WEBHOOK ERROR] Backend error:", data);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[WEBHOOK ERROR] Erro ao encaminhar webhook:", error);
    return NextResponse.json(
      { error: "Erro ao processar webhook." },
      { status: 500 }
    );
  }
}
