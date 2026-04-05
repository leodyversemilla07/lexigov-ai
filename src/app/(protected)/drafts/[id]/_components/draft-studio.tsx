import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { DraftSection } from "@/lib/draft-content";
import { SectionListItem } from "./section-list-item";

type DraftStudioProps = {
    content: string;
    wordCount: number;
    sectionOutline: DraftSection[];
    selectedSectionId: string;
    onContentChange: (content: string) => void;
    onSectionSelect: (sectionId: string) => void;
    onAddSection: () => void;
};

export function DraftStudio({
    content,
    wordCount,
    sectionOutline,
    selectedSectionId,
    onContentChange,
    onSectionSelect,
    onAddSection,
}: DraftStudioProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <CardTitle className="text-xl">Draft studio</CardTitle>
                        <CardDescription className="mt-1">
                            Work in the full-text editor and keep the structured section view synced.
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            Full text + sections stay synced
                        </Badge>
                        <Badge variant="outline" className="rounded-full px-3 py-1">
                            Best with formal headings
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="h-full">
                    <div className="flex h-full flex-col rounded-lg border bg-background">
                        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                            <div>
                                <div className="text-sm font-medium">Main ordinance body</div>
                                <div className="text-xs text-muted-foreground">
                                    Write freely here. Headings are parsed into the outline automatically.
                                </div>
                            </div>
                            <Badge variant="secondary" className="rounded-full px-3 py-1">
                                {wordCount.toLocaleString()} words
                            </Badge>
                        </div>
                        <div className="flex-1 p-4">
                            <Label htmlFor="content" className="sr-only">
                                Draft content
                            </Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(event) => onContentChange(event.target.value)}
                                rows={24}
                                className="h-full min-h-[620px] resize-y border-0 bg-transparent px-0 py-0 font-mono text-sm leading-7 shadow-none focus-visible:ring-0"
                                placeholder="Start writing your ordinance here..."
                            />
                        </div>
                    </div>
                </div>

                <div className="h-full">
                    <div className="flex h-full flex-col rounded-lg border bg-background">
                        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                            <div>
                                <div className="text-sm font-medium">Live outline</div>
                                <div className="text-xs text-muted-foreground">
                                    Jump between sections and expand the ordinance structure.
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={onAddSection}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add
                            </Button>
                        </div>
                        <div className="flex min-h-[620px] flex-1 flex-col p-3">
                            {sectionOutline.length === 0 ? (
                                <div className="flex flex-1 items-center rounded-lg border border-dashed p-5 text-sm leading-6 text-muted-foreground">
                                    Add headings like &quot;SECTION 1. Title.&quot; or create a section here to
                                    start a structured outline.
                                </div>
                            ) : (
                                <ScrollArea className="h-full flex-1 pr-3">
                                    <div className="space-y-3">
                                        {sectionOutline.map((section, index) => (
                                            <SectionListItem
                                                key={section.id}
                                                section={section}
                                                index={index}
                                                active={selectedSectionId === section.id}
                                                onSelect={onSectionSelect}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
