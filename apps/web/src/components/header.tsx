'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@lexigov/ui/components/breadcrumb';
import { Button } from '@lexigov/ui/components/button';
import { Separator } from '@lexigov/ui/components/separator';
import { SidebarTrigger } from '@lexigov/ui/components/sidebar';
import { FolderOpenDot, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';
import { OrganizationSwitcher } from '@/components/organization-switcher';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  drafts: 'Drafts',
  new: 'New Draft',
  templates: 'Templates',
  ai: 'AI Generator',
  compliance: 'Compliance',
  compare: 'Compare',
  export: 'Export',
  settings: 'App Settings',
  account: 'Account',
};

function getBreadcrumbItems(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return [{ href: '/dashboard', label: 'Dashboard', isCurrent: true }];
  }

  return segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    const previous = segments[index - 1];
    const isCurrent = index === segments.length - 1;

    let label = routeLabels[segment];

    if (!label) {
      if (previous === 'drafts') {
        label = 'Editor';
      } else {
        label = segment
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
      }
    }

    return { href, label, isCurrent };
  });
}

export function Header() {
  const pathname = usePathname();
  const breadcrumbs = getBreadcrumbItems(pathname);

  return (
    <header className='h-16 bg-background border-b flex items-center justify-between px-4 gap-4 shrink-0'>
      <div className='flex items-center gap-3 min-w-0'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='h-6' />
        <div className='hidden min-w-0 sm:block'>
          <div className='font-medium truncate'>LexiGov AI Workspace</div>
          <Breadcrumb>
            <BreadcrumbList className='text-xs'>
              {breadcrumbs.map((item, index) => (
                <Fragment key={item.href}>
                  <BreadcrumbItem>
                    {item.isCurrent ? (
                      <BreadcrumbPage className='text-xs'>{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild className='text-xs'>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 ? <BreadcrumbSeparator /> : null}
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className='flex items-center gap-3'>
        <OrganizationSwitcher />
        <Button variant='outline' size='sm' className='hidden lg:inline-flex' asChild>
          <Link href='/templates'>
            <FolderOpenDot className='mr-2 h-4 w-4' />
            Templates
          </Link>
        </Button>
        <Button size='sm' className='hidden lg:inline-flex' asChild>
          <Link href='/ai'>
            <Sparkles className='mr-2 h-4 w-4' />
            AI Draft
          </Link>
        </Button>
      </div>
    </header>
  );
}
