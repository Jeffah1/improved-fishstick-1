import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const order = await req.json();
    console.log(`Shopify Order Updated: ${order.id}`);
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
