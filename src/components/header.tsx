'use client';
import { FileDigit, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';

export default function Header() {
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <Link href="/dashboard" className="flex items-center gap-2">
        <FileDigit className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold tracking-tight">InvoiceSwift</span>
      </Link>
      <div className="ml-auto">
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </header>
  );
}
