"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

function AuthAwareActions({
    signedOut,
    signedIn,
}: {
    signedOut: React.ReactNode;
    signedIn: React.ReactNode;
}) {
    const { data: session } = useSession();
    return <>{session ? signedIn : signedOut}</>;
}

export function HomeNavActions() {
    return (
        <AuthAwareActions
            signedOut={
                <>
                    <Button variant="ghost" asChild>
                        <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/sign-up">Get Started</Link>
                    </Button>
                </>
            }
            signedIn={
                <Button asChild>
                    <Link href="/dashboard">Dashboard</Link>
                </Button>
            }
        />
    );
}

export function HomeHeroActions() {
    return (
        <AuthAwareActions
            signedOut={
                <>
                    <Button size="lg" asChild>
                        <Link href="/sign-up">
                            Start Drafting
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <Link href="/sign-in">Sign In</Link>
                    </Button>
                </>
            }
            signedIn={
                <Button size="lg" asChild>
                    <Link href="/dashboard">
                        Go to Dashboard
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </Button>
            }
        />
    );
}

export function HomeCtaActions() {
    return (
        <AuthAwareActions
            signedOut={
                <Button size="lg" variant="secondary" asChild>
                    <Link href="/sign-up">
                        Get Started Free
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </Button>
            }
            signedIn={
                <Button size="lg" variant="secondary" asChild>
                    <Link href="/dashboard">
                        Go to Dashboard
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </Button>
            }
        />
    );
}
