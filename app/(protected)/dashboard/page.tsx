"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { FileText, Plus, Sparkles, LayoutTemplate, CheckCircle, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Draft {
    _id: string;
    title: string;
    documentType: string;
    jurisdictionName: string;
    status: string;
    aiGenerated: boolean;
    updatedAt: number;
}

export default function DashboardPage() {
    const drafts = useQuery(api.drafts.list, { limit: 5 });
    const templates = useQuery(api.templates.list, { publicOnly: true });
    const isLoading = drafts === undefined;

    const stats = {
        total: drafts?.length ?? 0,
        aiGenerated: drafts?.filter((d: Draft) => d.aiGenerated).length ?? 0,
        templates: templates?.length ?? 0,
    };

    const recentDrafts = drafts?.slice(0, 5) ?? [];
    
    const getStatusColor = (status: string) => {
        switch (status) {
            case "DRAFT": return "bg-yellow-100 text-yellow-800";
            case "REVIEW": return "bg-blue-100 text-blue-800";
            case "FINAL": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Welcome back to LexiGov AI</p>
                </div>
                <Button asChild>
                    <Link href="/drafts/new">
                        <Plus className="w-4 h-4 mr-2" />
                        New Draft
                    </Link>
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Drafts</CardTitle>
                            <FileText className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {stats.total === 0 ? "Get started by creating a draft" : `${stats.total} ordinance drafts`}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Templates</CardTitle>
                            <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.templates}</div>
                            <p className="text-xs text-muted-foreground mt-1">Reusable ordinance templates</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">AI Generations</CardTitle>
                            <Sparkles className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.aiGenerated}</div>
                            <p className="text-xs text-muted-foreground mt-1">Drafts created with AI</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Drafts</CardTitle>
                            <CardDescription>Your latest ordinance drafts</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/drafts">View All <ArrowRight className="ml-1 h-4 w-4" /></Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-3">
                                {[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}
                            </div>
                        ) : recentDrafts.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="w-10 h-10 mx-auto text-muted mb-2" />
                                <p className="text-muted-foreground mb-4">No drafts yet</p>
                                <Button asChild>
                                    <Link href="/ai">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Create with AI
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentDrafts.map((draft: Draft) => (
                                    <div key={draft._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2 bg-muted rounded-lg shrink-0">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium truncate">{draft.title}</div>
                                                <div className="text-xs text-muted-foreground truncate">{draft.documentType} • {draft.jurisdictionName}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge className={getStatusColor(draft.status)}>{draft.status}</Badge>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/drafts/${draft._id}`}>Edit</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Create and manage ordinance drafts</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button asChild className="w-full justify-start" variant="outline">
                                <Link href="/ai">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate with AI
                                </Link>
                            </Button>
                            <Button asChild className="w-full justify-start" variant="outline">
                                <Link href="/templates">
                                    <LayoutTemplate className="w-4 h-4 mr-2" />
                                    Browse Templates
                                </Link>
                            </Button>
                            <Button asChild className="w-full justify-start" variant="outline">
                                <Link href="/compliance">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Check Compliance
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Compliance Status</CardTitle>
                            <CardDescription>RA 7160 compliance overview</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 mb-3">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span className="text-sm">System Ready</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs">RA 7160</Badge>
                                <Badge variant="outline" className="text-xs">1987 Constitution</Badge>
                                <Badge variant="outline" className="text-xs">DILG</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
