'use client';
import { LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import {
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

export default function Header() {
  const auth = useAuth();
  const router = useRouter();
  const { isMobile } = useSidebar();

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
      router.push('/login');
    }
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <div className="flex items-center gap-2 md:hidden">
        {(isMobile) && <SidebarTrigger />}
        <span className="text-xl font-bold tracking-tight">InvoiceSwift</span>
      </div>
      
      <div className="ml-auto">
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </header>
  );
}
