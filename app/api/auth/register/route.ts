import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'users.json');

function getUsers() {
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([]));
    return [];
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveUsers(users: any[]) {
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    const users = getUsers();

    if (users.find((u: any) => u.email === email)) {
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

    users.push(newUser);
    saveUsers(users);

    const { password: _, ...userWithoutPassword } = newUser;
    await login(userWithoutPassword);

    return NextResponse.json({ user: userWithoutPassword });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
