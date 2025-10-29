
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'View Invoice',
};

export default function ViewInvoiceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
