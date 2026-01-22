import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: "Assinatura ausente." }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[WEBHOOK ERROR] STRIPE_WEBHOOK_SECRET não configurado');
    return NextResponse.json({ error: "Webhook secret não configurado." }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[WEBHOOK ERROR] Verificação de assinatura falhou:', err);
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown'}` },
      { status: 400 }
    );
  }

  // Processar eventos do Stripe
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Pegar o authUserId dos metadados
        const authUserId = session.metadata?.authUserId;
        if (!authUserId) {
          console.error('[WEBHOOK ERROR] authUserId não encontrado nos metadados');
          break;
        }

        // Atualizar o backend para marcar usuário como premium
        const backendUrl = (process.env.BACKEND_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
        const syncSecret = process.env.BACKEND_SYNC_SECRET?.trim();

        // Primeiro, buscar o playerId
        const meUrl = new URL(`${backendUrl}/api/me`);
        meUrl.searchParams.set("authUserId", authUserId);

        const meResp = await fetch(meUrl.toString(), {
          headers: {
            ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
          },
        });

        if (!meResp.ok) {
          console.error('[WEBHOOK ERROR] Falha ao buscar dados do usuário no backend');
          break;
        }

        const meData = await meResp.json();
        const playerId = meData?.player?.id;

        if (!playerId) {
          console.error('[WEBHOOK ERROR] PlayerId não encontrado');
          break;
        }

        // Atualizar isPremium no backend
        const updateResp = await fetch(`${backendUrl}/api/player/settings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
          },
          body: JSON.stringify({
            playerId,
            isPremium: true,
          }),
        });

        if (!updateResp.ok) {
          console.error('[WEBHOOK ERROR] Falha ao atualizar isPremium no backend');
          const errorText = await updateResp.text();
          console.error('[WEBHOOK ERROR] Resposta:', errorText);
        } else {
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        // Aqui você pode implementar lógica para remover o premium quando a assinatura for cancelada
        // Isso requereria armazenar o customer_id ou subscription_id associado ao usuário

        break;
      }

      default:
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[WEBHOOK ERROR] Erro ao processar evento:', error);
    return NextResponse.json(
      { error: "Erro ao processar webhook." },
      { status: 500 }
    );
  }
}
