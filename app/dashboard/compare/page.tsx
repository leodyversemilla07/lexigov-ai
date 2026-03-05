"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, ArrowLeftRight } from "lucide-react";

export default function ComparePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Compare Versions</h1>
                <p className="text-muted-foreground">
                    Compare different versions of your ordinance drafts
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Version A</CardTitle>
                        <CardDescription>Select the first version</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full h-32 border-dashed">
                            <div className="text-center">
                                <FileCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <span className="text-muted-foreground">Select a draft version</span>
                            </div>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Version B</CardTitle>
                        <CardDescription>Select the second version</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full h-32 border-dashed">
                            <div className="text-center">
                                <FileCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <span className="text-muted-foreground">Select a draft version</span>
                            </div>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-center">
                <Button size="lg" disabled>
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Compare Versions
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Comparison Results</CardTitle>
                    <CardDescription>
                        Differences between the selected versions will appear here
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm text-center py-8">
                        Select two versions to compare
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
