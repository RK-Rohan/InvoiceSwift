'use client';

import {
  FileText,
  Users,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const menuItems = [
  {
    label: 'Invoices',
    href: '/invoices',
    icon: FileText,
  },
  {
    label: 'Clients',
    href: '/clients',
    icon: Users,
  },
  {
    label: 'Settings',
    icon: Settings,
    children: [
      {
        label: 'General',
        href: '/settings/general',
      },
    ],
  },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const [openSettings, setOpenSettings] = useState(pathname.startsWith('/settings'));

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
        {menuItems.map((item) =>
          item.children ? (
            <Collapsible key={item.label} open={openSettings} onOpenChange={setOpenSettings} className="w-full">
                <CollapsibleTrigger
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary w-full',
                    pathname.startsWith('/settings') && 'text-primary bg-muted'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  <ChevronDown
                    className={cn(
                      'ml-auto h-4 w-4 transition-transform',
                      openSettings && 'rotate-180'
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pl-7">
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                          pathname === child.href && 'text-primary'
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </CollapsibleContent>
            </Collapsible>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                pathname === item.href && 'text-primary bg-muted'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        )}
      </nav>
  );
}
