import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import { usersStore } from '@/lib/mock-db';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (usersStore.find((u: any) => u.email === email)) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const newUser = {
      id: Math.random().toString(36).substring(7),
      email,
      password,
      name,
      plan: 'free',
      createdAt: new Date().toISOString(),
    };

    usersStore.push(newUser);

    const { password: _, ...userWithoutPassword } = newUser;
    await login(userWithoutPassword);

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
