"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  FileText,
  LayoutTemplate,
  Home,
  Settings,
  Sparkles,
  Scale,
  FileCheck,
  Download,
} from "lucide-react"

import { NavLinks, type NavGroup } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const UserButton = dynamic(
  () => import("@clerk/nextjs").then((mod) => mod.UserButton),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="size-9 rounded-full border bg-muted"
      />
    ),
  },
)

const navigation: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: Home },
      { title: "Drafts", url: "/drafts", icon: FileText },
      { title: "Templates", url: "/templates", icon: LayoutTemplate },
    ],
  },
  {
    label: "Draft Tools",
    items: [
      { title: "AI Generator", url: "/ai", icon: Sparkles },
      { title: "Compliance", url: "/compliance", icon: Scale },
      { title: "Compare", url: "/compare", icon: FileCheck },
      { title: "Export", url: "/export", icon: Download },
    ],
  },
  {
    label: "Settings",
    items: [
      { title: "App Settings", url: "/settings", icon: Settings },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-lg shrink-0">
                  L
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">LexiGov</span>
                  <span className="truncate text-xs text-muted-foreground">AI Ordinance Generator</span>
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
            <div className="flex items-center gap-3 rounded-md px-2 py-2 group-data-[collapsible=icon]:justify-center">
              <UserButton
                afterSignOutUrl="/"
                userProfileMode="navigation"
                userProfileUrl="/account"
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9",
                  },
                }}
              />
              <div className="min-w-0 text-sm group-data-[collapsible=icon]:hidden">
                <div className="truncate font-medium text-sidebar-foreground">Account</div>
                <div className="truncate text-xs text-muted-foreground">Manage profile</div>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
