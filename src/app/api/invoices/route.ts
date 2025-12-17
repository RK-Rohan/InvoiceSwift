import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { createInvoice, listInvoices } from '@/lib/data/repository';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || (session?.user as { uid?: string })?.uid;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await listInvoices(userId);
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || (session?.user as { uid?: string })?.uid;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await request.json();
  const invoice = await createInvoice(userId, payload);
  return NextResponse.json({ data: invoice }, { status: 201 });
}
