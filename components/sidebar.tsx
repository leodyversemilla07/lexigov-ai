"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutTemplate, Home, Settings, Sparkles, Scale, FileCheck, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Drafts", href: "/dashboard/drafts", icon: FileText },
    { name: "Templates", href: "/dashboard/templates", icon: LayoutTemplate },
    { name: "AI Generator", href: "/dashboard/ai", icon: Sparkles },
    { name: "Compliance", href: "/dashboard/compliance", icon: Scale },
    { name: "Compare", href: "/dashboard/compare", icon: FileCheck },
    { name: "Export", href: "/dashboard/export", icon: Download },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-background border-r flex flex-col">
            {/* Logo */}
            <div className="p-6">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-xl">L</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">LexiGov</h1>
                        <p className="text-xs text-muted-foreground">AI Ordinance Generator</p>
                    </div>
                </Link>
            </div>

            <Separator />

            {/* Navigation */}
            <ScrollArea className="flex-1 py-4">
                <nav className="px-4 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </ScrollArea>

            <Separator />

            {/* Footer */}
            <div className="p-4">
                <div className="text-xs text-muted-foreground text-center">
                    <p>RA 7160 Compliant</p>
                    <p className="mt-1">Philippine Local Government</p>
                </div>
            </div>
        </aside>
    );
}
