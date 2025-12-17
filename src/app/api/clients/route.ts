import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { createClient, listClients } from '@/lib/data/repository';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || (session?.user as { uid?: string })?.uid;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await listClients(userId);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || (session?.user as { uid?: string })?.uid;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, email, phoneNumber, address } = body || {};
  if (!name || !email || !address) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const client = await createClient(userId, { name, email, phoneNumber, address });
  return NextResponse.json({ data: client }, { status: 201 });
}
