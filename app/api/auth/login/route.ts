import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { usersStore } from '@/lib/mock-db';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const user = usersStore.find((u: any) => u.email === email && u.password === password);

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const { password: _, ...userWithoutPassword } = user;
    await login(userWithoutPassword);

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
