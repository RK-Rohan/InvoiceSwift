'use client';

import { useMemo } from 'react';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { type InvoiceWithId } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, CircleDollarSign, FileText } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const invoicesCollection = useMemoFirebase(
    () => (user && firestore ? collection(firestore, 'users', user.uid, 'invoices') : null),
    [user, firestore]
  );
  
  const allInvoicesQuery = useMemoFirebase(
      () => (invoicesCollection ? query(invoicesCollection, orderBy('issueDate', 'desc')) : null),
      [invoicesCollection]
  );

  const {
    data: invoices,
    isLoading,
    error,
  } = useCollection<InvoiceWithId>(allInvoicesQuery);

  const calculateSubtotal = (invoice: InvoiceWithId) => {
    return invoice.items.reduce((acc, item) => {
      let itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
      if (item.customFields && invoice.customColumns) {
        item.customFields.forEach(field => {
          const column = invoice.customColumns?.find(c => c.name === field.name);
          const value = parseFloat(field.value) || 0;
          if (column?.type === 'subtractive') itemTotal -= value;
          else if (column?.type === 'additive') itemTotal += value;
        });
      }
      return acc + itemTotal;
    }, 0);
  };

  const dashboardData = useMemo(() => {
    if (!invoices) {
      return {
        totalRevenue: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        chartData: [],
        recentInvoices: [],
      };
    }

    let totalRevenue = 0;
    let totalCollected = 0;

    invoices.forEach(invoice => {
      const subtotal = calculateSubtotal(invoice);
      const invoiceTotal = subtotal - (invoice.discount || 0);
      totalRevenue += invoiceTotal;
      totalCollected += invoice.totalPaid || 0;
    });

    const recentInvoices = invoices.slice(0, 5);

    const chartData = recentInvoices.map(invoice => {
        const subtotal = calculateSubtotal(invoice);
        return {
            name: invoice.invoiceNumber,
            total: subtotal - (invoice.discount || 0)
        }
    }).reverse();


    return {
      totalRevenue,
      totalCollected,
      totalOutstanding: totalRevenue - totalCollected,
      chartData,
      recentInvoices,
    };
  }, [invoices]);
  
  if (isLoading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return <p className="text-destructive">Error: {error.message}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Total amount from all invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Collected
            </CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalCollected)}</div>
             <p className="text-xs text-muted-foreground">
              Total payments received
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">
              Total amount pending
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
            <CardHeader>
                <CardTitle>Recent Invoice Activity</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={dashboardData.chartData}>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${formatCurrency(value, 'USD').slice(0, -3)}k`}
                        />
                         <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                         />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        <Card className="lg:col-span-3">
             <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dashboardData.recentInvoices.map(invoice => (
                             <TableRow key={invoice.id}>
                                <TableCell>
                                    <div className="font-medium">{invoice.clientName}</div>
                                    <div className="text-sm text-muted-foreground">{invoice.invoiceNumber}</div>
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(calculateSubtotal(invoice) - (invoice.discount || 0), invoice.currency)}
                                </TableCell>
                                <TableCell>
                                    {invoice.issueDate ? format(new Date(invoice.issueDate), 'dd MMM, yyyy') : ''}
                                </TableCell>
                             </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <Button asChild variant="link" className="px-0">
                    <Link href="/invoices">View all invoices</Link>
                </Button>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
