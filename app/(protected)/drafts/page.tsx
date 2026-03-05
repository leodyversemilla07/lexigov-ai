"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { FileText, Plus, Search, Filter } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Draft {
    _id: string;
    _creationTime: number;
    title: string;
    documentType: string;
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

    const filteredDrafts = drafts?.filter((draft: Draft) => {
        const matchesSearch = draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            draft.jurisdictionName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || draft.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const isLoading = drafts === undefined;

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
                <Button asChild>
                    <Link href="/drafts/new">
                        <Plus className="w-4 h-4 mr-2" />
                        New Draft
                    </Link>
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
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
                            <SelectTrigger className="w-[180px]">
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
                                {searchQuery || statusFilter !== "ALL" 
                                    ? "Try adjusting your search or filters"
                                    : "Get started by creating your first ordinance draft"
                                }
                            </p>
                            {!searchQuery && statusFilter === "ALL" && (
                                <Button asChild>
                                    <Link href="/drafts/new">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create Draft
                                    </Link>
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredDrafts.map((draft: Draft) => (
                                <div
                                    key={draft._id}
                                    className="p-6 hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold">
                                                    {draft.title}
                                                </h3>
                                                {draft.aiGenerated && (
                                                    <Badge variant="secondary">AI Generated</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-3">
                                                {draft.documentType} • {draft.jurisdictionName} • v{draft.version}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>Updated {new Date(draft.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
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
                                            <Button variant="ghost" asChild>
                                                <Link href={`/drafts/${draft._id}`}>
                                                    Edit
                                                </Link>
                                            </Button>
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
