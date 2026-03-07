import { FileText, LayoutTemplate, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { DraftComposerForm } from "@/components/new-draft-form";

export default function NewDraftPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Manual Draft</h1>
                <p className="text-muted-foreground">
                    Start a new ordinance draft from a blank setup and fill in the details yourself
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardDescription>Draft Mode</CardDescription>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Manual First</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardDescription>Document Types</CardDescription>
                        <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardDescription>Typical Setup</CardDescription>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Under 1 min</div>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <div>
                        <h2 className="text-xl font-semibold">Draft Configuration</h2>
                        <p className="text-sm text-muted-foreground">
                            Provide the ordinance title, document type, and jurisdiction details to start your manual draft
                        </p>
                    </div>
                </CardHeader>
                <CardContent>
                    <DraftComposerForm wrapped={false} submitLabel="Create Manual Draft" />
                </CardContent>
            </Card>
        </div>
    );
}
