"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Search, Sparkles, FileCheck, Clock3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";

const notifications = [
    {
        title: "AI draft ready for review",
        description: "Your latest ordinance draft has been generated successfully.",
        icon: Sparkles,
    },
    {
        title: "Compliance check available",
        description: "Run RA 7160 validation on your recent draft updates.",
        icon: FileCheck,
    },
    {
        title: "Last save synced",
        description: "Recent draft changes were saved a few moments ago.",
        icon: Clock3,
    },
];

export function Header() {
    return (
        <TooltipProvider>
            <header className="h-16 bg-background border-b flex items-center justify-between px-4 gap-4 shrink-0">
                {/* Left: Sidebar toggle + Search */}
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="h-6" />
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search drafts, templates..."
                            className="pl-9 w-64"
                        />
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <Bell className="w-5 h-5" />
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
                                    </Button>
                                </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Notifications</p>
                            </TooltipContent>
                        </Tooltip>
                        <DropdownMenuContent align="end" className="w-80 p-0">
                            <DropdownMenuLabel className="px-4 py-3">
                                Notifications
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.title}
                                        className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                            <notification.icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {notification.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Separator orientation="vertical" className="h-8" />
                    
                    <UserButton 
                        afterSignOutUrl="/"
                        userProfileMode="navigation"
                        userProfileUrl="/account"
                        appearance={{
                            elements: {
                                avatarBox: "w-9 h-9"
                            }
                        }}
                    />
                </div>
            </header>
        </TooltipProvider>
    );
}
