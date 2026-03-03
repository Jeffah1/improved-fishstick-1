import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log('Stripe Webhook received');
  return NextResponse.json({ received: true });
}
