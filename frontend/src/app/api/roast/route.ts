import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const backendUrl = (process.env.BACKEND_URL?.trim() || "http://localhost:3000").replace(/\/+$/, "");
  const syncSecret = process.env.BACKEND_SYNC_SECRET?.trim();

  try {
    const body = await req.json();

    const response = await fetch(`${backendUrl}/api/roast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(syncSecret ? { "x-sync-secret": syncSecret } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
        return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'System Error: Connection to Core Failed.' },
      { status: 500 }
    );
  }
}
