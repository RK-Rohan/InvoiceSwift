import { FileDigit } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <Link href="/" className="flex items-center gap-2">
        <FileDigit className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold tracking-tight">InvoiceSwift</span>
      </Link>
    </header>
  );
}
