"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FileText, Plus, Search, Filter, Shield, Download, Sparkles, MoreHorizontal, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Draft {
    _id: string;
    _creationTime: number;
    title: string;
    documentType: string;
    jurisdiction: string;
    jurisdictionName: string;
    status: string;
    aiGenerated: boolean;
    version: number;
    updatedAt: number;
}

export default function DraftsPage() {
    const drafts = useQuery(api.drafts.list, {});
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [typeFilter, setTypeFilter] = useState<string>("ALL");

    const filteredDrafts = drafts?.filter((draft: Draft) => {
        const matchesSearch = draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            draft.jurisdictionName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || draft.status === statusFilter;
        const matchesType = typeFilter === "ALL" || draft.documentType === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    const isLoading = drafts === undefined;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "DRAFT": return "bg-yellow-100 text-yellow-800";
            case "REVIEW": return "bg-blue-100 text-blue-800";
            case "FINAL": return "bg-green-100 text-green-800";
            case "ARCHIVED": return "bg-gray-100 text-gray-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const stats = {
        total: drafts?.length || 0,
        draft: drafts?.filter((d: Draft) => d.status === "DRAFT").length || 0,
        review: drafts?.filter((d: Draft) => d.status === "REVIEW").length || 0,
        final: drafts?.filter((d: Draft) => d.status === "FINAL").length || 0,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Drafts</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and organize your ordinance drafts
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/ai">
                            <Sparkles className="w-4 h-4 mr-2" />
                            AI Generator
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/drafts/new">
                            <Plus className="w-4 h-4 mr-2" />
                            New Draft
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <div className="text-sm text-muted-foreground">Total Drafts</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <FileText className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{stats.draft}</div>
                            <div className="text-sm text-muted-foreground">In Draft</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{stats.review}</div>
                            <div className="text-sm text-muted-foreground">In Review</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <FileText className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{stats.final}</div>
                            <div className="text-sm text-muted-foreground">Final</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4 flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search drafts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="REVIEW">Review</SelectItem>
                                <SelectItem value="FINAL">Final</SelectItem>
                                <SelectItem value="ARCHIVED">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Types</SelectItem>
                                <SelectItem value="ORDINANCE">Ordinance</SelectItem>
                                <SelectItem value="RESOLUTION">Resolution</SelectItem>
                                <SelectItem value="MEMORANDUM">Memorandum</SelectItem>
                                <SelectItem value="POLICY">Policy</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Drafts List */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-6 space-y-4">
                            {Array(5).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-20" />
                            ))}
                        </div>
                    ) : !filteredDrafts || filteredDrafts.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-muted" />
                            <h3 className="text-lg font-medium mb-2">No drafts found</h3>
                            <p className="text-muted-foreground mb-6">
                                {searchQuery || statusFilter !== "ALL" || typeFilter !== "ALL" 
                                    ? "Try adjusting your search or filters"
                                    : "Get started by creating your first ordinance draft"
                                }
                            </p>
                            {!searchQuery && statusFilter === "ALL" && typeFilter === "ALL" && (
                                <div className="flex justify-center gap-4">
                                    <Button asChild>
                                        <Link href="/ai">
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Create with AI
                                        </Link>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link href="/drafts/new">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Manually
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredDrafts.map((draft: Draft) => (
                                <div
                                    key={draft._id}
                                    className="p-4 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="p-2 bg-muted rounded-lg shrink-0">
                                                <FileText className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold truncate">
                                                        {draft.title}
                                                    </h3>
                                                    {draft.aiGenerated && (
                                                        <Badge variant="secondary" className="shrink-0">
                                                            <Sparkles className="w-3 h-3 mr-1" />
                                                            AI
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                                                    <span className="font-medium">{draft.documentType}</span>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[200px]">{draft.jurisdictionName}</span>
                                                    <span>•</span>
                                                    <span>v{draft.version}</span>
                                                    <span>•</span>
                                                    <span>{new Date(draft.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3 shrink-0">
                                            <Badge className={getStatusColor(draft.status)}>
                                                {draft.status}
                                            </Badge>
                                            
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/drafts/${draft._id}`}>
                                                        Edit
                                                        <ArrowRight className="ml-1 h-3 w-3" />
                                                    </Link>
                                                </Button>
                                                
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/compliance?draft=${draft._id}`}>
                                                                <Shield className="mr-2 h-4 w-4" />
                                                                Check Compliance
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/export?draft=${draft._id}`}>
                                                                <Download className="mr-2 h-4 w-4" />
                                                                Export
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/templates?draft=${draft._id}`}>
                                                                <FileText className="mr-2 h-4 w-4" />
                                                                Use Template
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
