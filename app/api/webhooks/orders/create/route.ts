import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const order = await req.json();
    console.log(`New Shopify Order Received: ${order.id}`);
    
    // In a production app, you would save this to your DB
    // and potentially trigger a notification or update a cache.
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
