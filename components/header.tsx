"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function Header() {
    return (
        <TooltipProvider>
            <header className="h-16 bg-background border-b flex items-center justify-between px-6">
                {/* Search */}
                <div className="flex items-center flex-1 max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search drafts, templates..."
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Notifications</p>
                        </TooltipContent>
                    </Tooltip>
                    
                    <Separator orientation="vertical" className="h-8" />
                    
                    <UserButton 
                        afterSignOutUrl="/"
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
