"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Building, Shield } from "lucide-react";

function getInitials(name: string | null | undefined, email: string | null | undefined) {
    if (name) {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return "U";
}

export default function SettingsPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const user = session?.user;

    const displayName = user?.name ?? "User";
    const email = user?.email ?? "";
    const imageUrl = user?.image ?? undefined;

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">App Settings</h1>
                <p className="text-muted-foreground">
                    Manage application-specific preferences and organization details
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile Reference
                    </CardTitle>
                    <CardDescription>Read-only identity details from your account profile</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={imageUrl} alt={displayName} />
                            <AvatarFallback className="text-lg">
                                {getInitials(displayName, email)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold">{displayName}</h3>
                            <p className="text-sm text-muted-foreground">{email}</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input id="name" defaultValue={displayName} disabled placeholder="Your name" />
                            <p className="text-xs text-muted-foreground">
                                Manage your name from the dedicated Account page.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue={email} disabled />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Organization
                    </CardTitle>
                    <CardDescription>Your LGU information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="org">LGU / Organization Name</Label>
                        <Input id="org" placeholder="e.g., Municipality of Sample" />
                    </div>
                    <Button>Save Changes</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Session
                    </CardTitle>
                    <CardDescription>Manage your current session on this device</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-destructive">Sign Out</p>
                            <p className="text-sm text-muted-foreground">
                                Sign out of your account on this device
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => { signOut(); router.push("/"); }}>
                            Sign Out
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
