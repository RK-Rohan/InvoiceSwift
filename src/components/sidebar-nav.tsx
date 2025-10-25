'use client';

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  FileText,
  Users,
  Settings,
  LayoutDashboard,
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
    <SidebarContent>
      <SidebarMenu>
        {menuItems.map((item) =>
          item.children ? (
            <Collapsible key={item.label} asChild open={openSettings} onOpenChange={setOpenSettings}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className="justify-between"
                    isActive={pathname.startsWith('/settings')}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        openSettings && 'rotate-180'
                      )}
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent asChild>
                  <SidebarMenuSub>
                    {item.children.map((child) => (
                      <SidebarMenuSubItem key={child.label}>
                        <Link href={child.href} passHref>
                          <SidebarMenuSubButton
                            isActive={pathname === child.href}
                          >
                            {child.label}
                          </SidebarMenuSubButton>
                        </Link>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} passHref>
                <SidebarMenuButton isActive={pathname === item.href}>
                  <item.icon />
                  {item.label}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarContent>
  );
}
