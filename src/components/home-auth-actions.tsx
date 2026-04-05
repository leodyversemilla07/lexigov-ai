"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomeNavActions() {
  return (
    <>
      <SignedOut>
        <Button variant="ghost" asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button asChild>
          <Link href="/sign-up">Get Started</Link>
        </Button>
      </SignedOut>
      <SignedIn>
        <Button asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </SignedIn>
    </>
  );
}

export function HomeHeroActions() {
  return (
    <>
      <SignedOut>
        <Button size="lg" asChild>
          <Link href="/sign-up">
            Start Drafting
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </SignedOut>
      <SignedIn>
        <Button size="lg" asChild>
          <Link href="/dashboard">
            Go to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
      </SignedIn>
    </>
  );
}

export function HomeCtaActions() {
  return (
    <>
      <SignedOut>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/sign-up">
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
      </SignedOut>
      <SignedIn>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/dashboard">
            Go to Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
      </SignedIn>
    </>
  );
}
