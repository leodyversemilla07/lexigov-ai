"use client"

import * as React from "react"
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

import { NavLinks } from "@/components/nav-main"
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

const navigation = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Drafts", url: "/dashboard/drafts", icon: FileText },
  { title: "Templates", url: "/dashboard/templates", icon: LayoutTemplate },
  { title: "AI Generator", url: "/dashboard/ai", icon: Sparkles },
  { title: "Compliance", url: "/dashboard/compliance", icon: Scale },
  { title: "Compare", url: "/dashboard/compare", icon: FileCheck },
  { title: "Export", url: "/dashboard/export", icon: Download },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
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
        <div className="px-3 pb-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <p>RA 7160 Compliant</p>
          <p className="mt-0.5">Philippine Local Government</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
