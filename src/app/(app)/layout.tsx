'use client';
import { useUser } from '@/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import Header from '@/components/header';
import SidebarNav from '@/components/sidebar-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="grid min-h-screen w-full md:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr] bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="hidden border-r bg-white/80 backdrop-blur md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-5">
              <span className="text-lg font-bold tracking-tight">InvoiceSwift</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <SidebarNav />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <Header />
          <main className="flex flex-1 flex-col items-center px-4 py-4 lg:px-8 lg:py-6 bg-gradient-to-b from-white/80 to-slate-50">
            <div className="w-full max-w-6xl p-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
