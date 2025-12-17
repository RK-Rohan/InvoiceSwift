import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { getCompanyProfile, upsertCompanyProfile } from '@/lib/data/repository';

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || (session?.user as { uid?: string })?.uid;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await getCompanyProfile(userId);
  return NextResponse.json({ data: profile });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || (session?.user as { uid?: string })?.uid;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = await request.json();
  const profile = await upsertCompanyProfile(userId, payload);
  return NextResponse.json({ data: profile });
}
