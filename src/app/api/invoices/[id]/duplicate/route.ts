import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { duplicateInvoiceForUser } from '@/lib/data/repository';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || (session?.user as { uid?: string })?.uid;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const invoice = await duplicateInvoiceForUser(userId, params.id);
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: invoice }, { status: 201 });
}
