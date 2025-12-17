import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { deleteClientById, updateClientById } from '@/lib/data/repository';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || (session?.user as { uid?: string })?.uid;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  await updateClientById(userId, params.id, body || {});
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || (session?.user as { uid?: string })?.uid;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await deleteClientById(userId, params.id);
  return NextResponse.json({ ok: true });
}
