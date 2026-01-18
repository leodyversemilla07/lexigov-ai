import * as React from 'react';
import { cn } from '../lib/utils';
import * as LucideIcons from 'lucide-react';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  organization?: string;
  firebaseUid?: string;
}

type NavItem = {
  id: string;
  label: string;
  icon: keyof typeof LucideIcons;
  href: string;
};

/**
 * Sidebar Navigation Component
 */
export function Sidebar({
  currentPage,
  onPageChange,
  user,
}: {
  currentPage: string;
  onPageChange: (page: string) => void;
  user?: User;
}) {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', href: '/' },
    { id: 'drafts', label: 'My Drafts', icon: 'FileText', href: '/drafts' },
    { id: 'templates', label: 'Templates', icon: 'Template', href: '/templates' },
    { id: 'compliance', label: 'Compliance', icon: 'ShieldCheck', href: '/compliance' },
    { id: 'export', label: 'Export', icon: 'Download', href: '/export' },
  ];

  const IconComponent = (iconName: keyof typeof LucideIcons) => {
    const Icon = LucideIcons[iconName];
    return Icon ? <Icon className="h-5 w-5" /> : null;
  };

  return (
    <aside className="w-64 h-screen bg-gray-50 border-r border-gray-200">
      <div className="flex flex-col h-full">
        {/* Logo and Brand */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  d="M9 12l2 2 4-2m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LexiGov</h1>
              <p className="text-sm text-gray-500">AI Ordinance Assistant</p>
            </div>
          </div>
        </div>

        {/* User Profile */}
        {user && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center">
                <span className="text-xl font-bold">
                  {user.name || user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {user.name || 'User'}
                </div>
                <div className="text-xs text-gray-600">
                  {user.email || 'No email'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {user.role || 'Staff Member'}
                </div>
                {user.organization && (
                  <div className="text-xs text-gray-500">
                    {user.organization}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 flex-col space-y-2 p-4">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={() => onPageChange(item.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-gray-100 cursor-pointer',
                currentPage === item.id
                  ? 'bg-gray-100 text-gray-900 font-semibold'
                  : 'text-gray-700 hover:text-gray-900',
              )}
            >
              {IconComponent(item.icon)}
              <span>{item.label}</span>
              {currentPage === item.id && (
                <LucideIcons.ChevronDown className="ml-1 h-4 w-4" />
              )}
            </a>
          ))}
        </nav>

        {/* Sign Out Button */}
        <div className="px-6 py-4 border-t border-gray-200 mt-auto">
          <button
            type="button"
            className="w-full text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}

/**
 * Layout Component with Sidebar
 */
export function Layout({
  children,
  user,
  currentPage = 'dashboard',
  onPageChange,
}: {
  children: React.ReactNode;
  user?: User;
  currentPage?: string;
  onPageChange?: (page: string) => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        currentPage={currentPage}
        onPageChange={onPageChange ?? (() => {})}
        user={user}
      />
      <main className="flex-1 flex-col">
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              {currentPage === 'dashboard' && 'Dashboard'}
              {currentPage === 'drafts' && 'My Drafts'}
              {currentPage === 'templates' && 'Templates'}
              {currentPage === 'compliance' && 'Compliance Checker'}
              {currentPage === 'export' && 'Export History'}
            </h2>
          </div>
        </header>

        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
