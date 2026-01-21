import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
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

    // Criar checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL}/?canceled=true`,
      metadata: {
        authUserId: session.user.id,
      },
      customer_email: session.user.email || undefined,
    });

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error) {
    console.error('[STRIPE CHECKOUT ERROR]', error);
    return NextResponse.json(
      { error: "Erro ao criar sessão de checkout." },
      { status: 500 }
    );
  }
}
