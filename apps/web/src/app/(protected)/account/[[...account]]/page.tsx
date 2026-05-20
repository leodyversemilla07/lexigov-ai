"use client";

import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

function getInitials(name: string | null | undefined, email: string | null | undefined) {
    if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    if (email) return email.slice(0, 2).toUpperCase();
    return "U";
}

export default function AccountPage() {
    const { data: session } = useSession();
    const user = session?.user;

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Manage Account</h1>
                <p className="text-muted-foreground">
                    Update your profile, security settings, and connected account details
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Profile
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? "User"} />
                            <AvatarFallback className="text-lg">
                                {getInitials(user?.name, user?.email)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold">{user?.name ?? "User"}</h3>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input defaultValue={user?.name ?? ""} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input defaultValue={user?.email ?? ""} disabled />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
