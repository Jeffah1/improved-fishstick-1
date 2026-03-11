export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { db } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    // We use the db abstraction which handles the login logic
    // The user requested supabaseAdmin to be imported correctly here
    const user = await db.login(email, password);

    await login(user);

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
