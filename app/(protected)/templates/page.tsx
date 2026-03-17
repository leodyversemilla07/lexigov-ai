"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, Suspense } from "react";
import Link from "next/link";
import { FolderOpen, Search, FileText, Plus, Sparkles, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const sampleTemplates = [
    { id: "curfew", name: "Curfew Ordinance", category: "Public Safety", description: "Establishing curfew hours for minors", jurisdictions: ["barangay", "municipal", "city"], usageCount: 156 },
    { id: "noise", name: "Noise Control", category: "Environment", description: "Regulating noise levels", jurisdictions: ["barangay", "municipal", "city", "provincial"], usageCount: 89 },
    { id: "sanitation", name: "Sanitation & Waste", category: "Health", description: "Waste segregation requirements", jurisdictions: ["barangay", "municipal", "city", "provincial"], usageCount: 234 },
    { id: "business", name: "Business Permit", category: "Business", description: "Business permit requirements", jurisdictions: ["municipal", "city", "provincial"], usageCount: 178 },
    { id: "animals", name: "Animal Control", category: "Public Safety", description: "Pet registration and control", jurisdictions: ["barangay", "municipal", "city"], usageCount: 67 },
    { id: "traffic", name: "Traffic Management", category: "Transportation", description: "Traffic regulations", jurisdictions: ["municipal", "city", "provincial"], usageCount: 112 },
    { id: "market", name: "Market Regulations", category: "Business", description: "Market vendor rules", jurisdictions: ["municipal", "city"], usageCount: 95 },
    { id: "blotter", name: "Blotter System", category: "Public Safety", description: "Incident documentation", jurisdictions: ["barangay"], usageCount: 203 },
];

function getTemplateId(t: { _id?: string; id?: string }) {
    return t._id || t.id || "";
}

function getTemplateJurs(t: { jurisdiction?: string[]; jurisdictions?: string[] }) {
    return t.jurisdiction || t.jurisdictions || [];
}

function getTemplateDesc(t: { description?: string; subcategory?: string }) {
    return t.description || t.subcategory || "Standard template";
}

function TemplatesPageContent() {
    const dbTemplates = useQuery(api.templates.list, { publicOnly: true });
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    
    const templates: typeof sampleTemplates = (dbTemplates && dbTemplates.length > 0) 
        ? dbTemplates as unknown as typeof sampleTemplates
        : sampleTemplates;

    const filteredTemplates = templates.filter((t) => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
        const matchesCategory = categoryFilter === "ALL" || t.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const isLoading = dbTemplates === undefined;
    const categories = [...new Set(sampleTemplates.map((t) => t.category))];

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, string> = {
            "Public Safety": "🛡️",
            "Environment": "🌿",
            "Health": "🏥",
            "Business": "🏪",
            "Transportation": "🚗",
        };
        return icons[category] || "📄";
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
                    <p className="text-muted-foreground">Browse and use ordinance templates for your LGU</p>
                </div>
                <Button asChild>
                    <Link href="/drafts/new"><Plus className="w-4 h-4 mr-2" />Create Custom</Link>
                </Button>
            </div>

            <Card>
                <CardContent className="p-4 flex flex-wrap gap-4">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search templates..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{getCategoryIcon(cat)} {cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48" />)}
                </div>
            ) : filteredTemplates.length === 0 ? (
                <Card>
                    <CardContent className="py-16 text-center">
                        <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted" />
                        <h3 className="text-lg font-medium mb-2">No templates found</h3>
                        <p className="text-muted-foreground">Try adjusting your search or filters</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTemplates.map((template) => (
                        <Card key={getTemplateId(template)} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
                                        <div>
                                            <CardTitle className="text-lg">{template.name}</CardTitle>
                                            <CardDescription className="flex items-center gap-1 mt-1">
                                                <span>{getCategoryIcon(template.category)}</span>
                                                <span>{template.category}</span>
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{getTemplateDesc(template)}</p>
                                <div className="flex flex-wrap gap-1 mb-4">
                                    {getTemplateJurs(template).map((j: string) => (
                                        <Badge key={j} variant="outline" className="text-xs capitalize">{j}</Badge>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Users className="h-3 w-3" /><span>{template.usageCount} uses</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/drafts/new?template=${getTemplateId(template)}`}>Use<ArrowRight className="ml-1 h-3 w-3" /></Link>
                                        </Button>
                                        <Button size="sm" asChild>
                                            <Link href={`/ai?template=${getTemplateId(template)}`}><Sparkles className="mr-1 h-3 w-3" />AI Fill</Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Card>
                <CardHeader><CardTitle>How to Use Templates</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="flex gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg h-fit"><FileText className="h-5 w-5 text-primary" /></div>
                            <div><h4 className="font-medium">Browse Templates</h4><p className="text-sm text-muted-foreground">Search and filter by category</p></div>
                        </div>
                        <div className="flex gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg h-fit"><Sparkles className="h-5 w-5 text-primary" /></div>
                            <div><h4 className="font-medium">AI-Assisted Fill</h4><p className="text-sm text-muted-foreground">Use AI to auto-fill content</p></div>
                        </div>
                        <div className="flex gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg h-fit"><Plus className="h-5 w-5 text-primary" /></div>
                            <div><h4 className="font-medium">Start Drafting</h4><p className="text-sm text-muted-foreground">Create draft from template</p></div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function TemplatesLoading() {
    return (
        <div className="space-y-6">
            <div><Skeleton className="h-10 w-64 mb-2" /><Skeleton className="h-5 w-96" /></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
        </div>
    );
}

export default function TemplatesPage() {
    return (
        <Suspense fallback={<TemplatesLoading />}>
            <TemplatesPageContent />
        </Suspense>
    );
}
