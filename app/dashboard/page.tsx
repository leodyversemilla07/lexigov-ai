"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FileText, Plus, Sparkles, LayoutTemplate, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Draft {
    _id: string;
    aiGenerated: boolean;
    status: string;
    title: string;
    documentType: string;
    jurisdictionName: string;
}

interface Template {
    _id: string;
    name: string;
    category: string;
}

export default function DashboardPage() {
    const drafts = useQuery(api.drafts.list, { limit: 5 });
    const templates = useQuery(api.templates.list, {});

    const stats = [
        { label: "Total Drafts", value: drafts?.length ?? 0, icon: FileText },
        { label: "Templates", value: templates?.length ?? 0, icon: LayoutTemplate },
        { label: "AI Generated", value: drafts?.filter((d: Draft) => d.aiGenerated).length ?? 0, icon: Sparkles },
        { label: "Finalized", value: drafts?.filter((d: Draft) => d.status === "FINAL").length ?? 0, icon: CheckCircle },
    ];

    const isLoading = drafts === undefined || templates === undefined;

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Create and manage RA 7160 compliant local government ordinances
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/drafts/new">
                        <Plus className="w-4 h-4 mr-2" />
                        New Draft
                    </Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {isLoading ? (
                    Array(4).fill(0).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <Skeleton className="h-16" />
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    stats.map((stat) => (
                        <Card key={stat.label}>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <stat.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                        <p className="text-2xl font-bold">{stat.value}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Drafts */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Drafts</CardTitle>
                        <CardDescription>Your latest ordinance drafts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {Array(3).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-16" />
                                ))}
                            </div>
                        ) : !drafts || drafts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="w-12 h-12 mx-auto mb-3 text-muted" />
                                <p>No drafts yet</p>
                                <Button variant="link" asChild className="mt-2">
                                    <Link href="/dashboard/drafts/new">
                                        Create your first draft
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {drafts.map((draft: Draft) => (
                                    <div
                                        key={draft._id}
                                        className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                    >
                                        <div>
                                            <h3 className="font-medium">{draft.title}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {draft.documentType} • {draft.jurisdictionName}
                                            </p>
                                        </div>
                                        <Badge 
                                            variant={
                                                draft.status === "DRAFT" ? "secondary" :
                                                draft.status === "REVIEW" ? "default" :
                                                draft.status === "FINAL" ? "default" :
                                                "outline"
                                            }
                                            className={cn(
                                                draft.status === "FINAL" && "bg-green-100 text-green-800 hover:bg-green-100"
                                            )}
                                        >
                                            {draft.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Templates */}
                <Card>
                    <CardHeader>
                        <CardTitle>Popular Templates</CardTitle>
                        <CardDescription>Start with a pre-built template</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                {Array(3).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-16" />
                                ))}
                            </div>
                        ) : !templates || templates.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <LayoutTemplate className="w-12 h-12 mx-auto mb-3 text-muted" />
                                <p>No templates available</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {templates.slice(0, 3).map((template: Template) => (
                                    <button
                                        key={template._id}
                                        className="w-full text-left p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                    >
                                        <h3 className="font-medium">{template.name}</h3>
                                        <p className="text-sm text-muted-foreground">{template.category}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
