import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = await db.login(email, password);

    await login(user);

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
