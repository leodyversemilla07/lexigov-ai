"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, Search, Filter } from "lucide-react";
import { useState } from "react";

interface Template {
    _id: string;
    name: string;
    category: string;
    usageCount: number;
}

export default function TemplatesPage() {
    const templates = useQuery(api.templates.list, {});
    const [searchQuery, setSearchQuery] = useState("");

    const filteredTemplates = templates?.filter((t: Template) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isLoading = templates === undefined;

    const categories = filteredTemplates
        ? [...new Set(filteredTemplates.map((t: Template) => t.category))]
        : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
                <p className="text-muted-foreground">
                    Browse and use ordinance templates for your LGU
                </p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search templates..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array(6).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted" />
                    <p>{searchQuery ? "No templates match your search" : "No templates available"}</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((category) => {
                        const count = filteredTemplates?.filter((t: Template) => t.category === category).length ?? 0;
                        return (
                            <Card key={category} className="cursor-pointer hover:bg-muted/50 transition-colors">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <FolderOpen className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{category}</CardTitle>
                                            <CardDescription>{count} template{count !== 1 ? "s" : ""}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
