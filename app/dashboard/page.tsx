"use client";

import Link from "next/link";
import { FileText, Plus, Sparkles, LayoutTemplate, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Welcome back to LexiGov AI</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/drafts/new">
                        <Plus className="w-4 h-4 mr-2" />
                        New Draft
                    </Link>
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Drafts</CardTitle>
                        <FileText className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground mt-1">Get started by creating a draft</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Templates</CardTitle>
                        <LayoutTemplate className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground mt-1">Reusable ordinance templates</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">AI Generations</CardTitle>
                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground mt-1">Drafts generated with AI</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions + Compliance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Create and manage ordinance drafts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button asChild className="w-full justify-start" variant="outline">
                            <Link href="/dashboard/drafts/new">
                                <Plus className="w-4 h-4 mr-2" />
                                Create New Draft
                            </Link>
                        </Button>
                        <Button asChild className="w-full justify-start" variant="outline">
                            <Link href="/dashboard/drafts/new">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate with AI
                            </Link>
                        </Button>
                        <Button asChild className="w-full justify-start" variant="outline">
                            <Link href="/dashboard/templates">
                                <LayoutTemplate className="w-4 h-4 mr-2" />
                                Browse Templates
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
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-sm">System is RA 7160 compliant</span>
                        </div>
                        <div className="mt-4">
                            <Badge variant="outline" className="text-xs">Philippine Local Government Code</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
