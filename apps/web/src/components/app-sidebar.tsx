'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@lexigov/ui/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@lexigov/ui/components/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@lexigov/ui/components/sidebar';
import {
  Download,
  FileCheck,
  FileText,
  Home,
  LayoutTemplate,
  LogOut,
  Scale,
  Settings,
  Sparkles,
  User,
} from 'lucide-react';
import Link from 'next/link';
import type * as React from 'react';
import { type NavGroup, NavLinks } from '@/components/nav-main';
import { signOut, useSession } from '@/lib/auth-client';

const navigation: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { title: 'Dashboard', url: '/dashboard', icon: Home },
      { title: 'Drafts', url: '/drafts', icon: FileText },
      { title: 'Templates', url: '/templates', icon: LayoutTemplate },
    ],
  },
  {
    label: 'Draft Tools',
    items: [
      { title: 'AI Generator', url: '/ai', icon: Sparkles },
      { title: 'Compliance', url: '/compliance', icon: Scale },
      { title: 'Compare', url: '/compare', icon: FileCheck },
      { title: 'Export', url: '/export', icon: Download },
    ],
  },
  {
    label: 'Settings',
    items: [{ title: 'App Settings', url: '/settings', icon: Settings }],
  },
];

function UserMenu() {
  const { data: session } = useSession();
  const user = session?.user;

  if (!user) return null;

  const initials = (user.name ?? user.email ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          className='flex items-center gap-3 rounded-md px-2 py-2 w-full hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center'
        >
          <Avatar className='size-9'>
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'User'} />
            <AvatarFallback className='text-xs'>{initials}</AvatarFallback>
          </Avatar>
          <div className='min-w-0 text-sm group-data-[collapsible=icon]:hidden text-left'>
            <div className='truncate font-medium text-sidebar-foreground'>{user.name ?? 'User'}</div>
            <div className='truncate text-xs text-muted-foreground'>{user.email}</div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel>
          {user.name ?? 'User'}
          <p className='text-xs font-normal text-muted-foreground'>{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href='/account'>
            <User className='size-4 mr-2' />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            signOut();
            window.location.href = '/';
          }}
        >
          <LogOut className='size-4 mr-2' />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <Link href='/dashboard'>
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-lg shrink-0'>
                  L
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>LexiGov</span>
                  <span className='truncate text-xs text-muted-foreground'>AI Ordinance Generator</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavLinks items={navigation} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
