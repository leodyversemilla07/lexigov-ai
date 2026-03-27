"use client";

import { UserButton } from "@clerk/nextjs";
import { FolderOpenDot, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function Header() {
    return (
        <header className="h-16 bg-background border-b flex items-center justify-between px-4 gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="h-6" />
                <div className="min-w-0">
                    <div className="font-medium truncate">LexiGov AI Workspace</div>
                    <div className="text-sm text-muted-foreground truncate">
                        Draft ordinances, apply saved templates, and validate RA 7160 compliance.
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/templates">
                        <FolderOpenDot className="mr-2 h-4 w-4" />
                        Templates
                    </Link>
                </Button>
                <Button size="sm" asChild>
                    <Link href="/ai">
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI Draft
                    </Link>
                </Button>
                <Separator orientation="vertical" className="h-8" />
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
            </div>
        </header>
    );
}
