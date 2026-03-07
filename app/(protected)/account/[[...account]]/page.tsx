import { UserProfile } from "@clerk/nextjs";

export default function AccountPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Manage Account</h1>
                <p className="text-muted-foreground">
                    Update your profile, security settings, and connected account details
                </p>
            </div>

            <div className="overflow-hidden rounded-xl border bg-card">
                <UserProfile
                    routing="path"
                    path="/account"
                    appearance={{
                        elements: {
                            rootBox: "w-full",
                            cardBox: "w-full shadow-none",
                            pageScrollBox: "p-0",
                        },
                    }}
                />
            </div>
        </div>
    );
}
