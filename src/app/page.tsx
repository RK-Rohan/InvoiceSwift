import Link from 'next/link';

const features = [
  'Create invoices in minutes',
  'Track payments and status',
  'Store clients securely',
  'Export and print anytime',
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="text-xl font-bold tracking-tight">InvoiceSwift</div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-900">
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-16 lg:px-10 lg:pb-24">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              Invoice faster
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Modern invoicing for freelancers and teams.
            </h1>
            <p className="text-lg text-slate-600">
              Draft, send, and track invoices with ease. Keep clients organized, monitor payments, and stay on top of cash flow without spreadsheets.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Start free
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800 hover:border-slate-400 hover:bg-white"
              >
                Log in
              </Link>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {features.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-white shadow-xl">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Preview</p>
                <p className="font-semibold text-slate-900">Invoice #INV-1024</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Final</span>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Bill To</span>
                <span className="font-semibold text-slate-800">Acme Corp</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount Due</span>
                <span className="text-lg font-bold text-slate-900">$2,450.00</span>
              </div>
              <div className="rounded-lg border bg-slate-50 p-4 space-y-2">
                <div className="flex justify-between text-slate-700">
                  <span>Website redesign</span>
                  <span>$2,000.00</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Hosting</span>
                  <span>$200.00</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Tax</span>
                  <span>$250.00</span>
                </div>
              </div>
              <div className="flex justify-between font-semibold text-slate-900">
                <span>Total</span>
                <span>$2,450.00</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
