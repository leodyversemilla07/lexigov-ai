"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/components/auth-provider"
import { Button } from "@workspace/ui/components/button"

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuthContext()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard")
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">LexiGov AI</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push("/login")}>
              Sign in
            </Button>
            <Button onClick={() => router.push("/signup")}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            AI-Powered Ordinance
            <br />
            <span className="text-primary">Drafting for LGUs</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Streamline your legislative drafting process with AI assistance.
            Generate compliant ordinances, resolutions, and executive orders
            following Philippine legal standards.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" onClick={() => router.push("/signup")}>
              Start Drafting Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push("/login")}>
              Sign In
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-3xl font-bold">
              Everything you need for legislative drafting
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-xl font-semibold">AI Generation</h3>
                <p className="mt-2 text-muted-foreground">
                  Generate ordinance drafts with AI, following proper Philippine
                  legislative format and structure.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-xl font-semibold">Compliance Check</h3>
                <p className="mt-2 text-muted-foreground">
                  Automatically verify your drafts against the Local Government
                  Code and other applicable laws.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-xl font-semibold">Template Library</h3>
                <p className="mt-2 text-muted-foreground">
                  Access pre-built templates for common ordinance types used by
                  barangays, municipalities, and cities.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 LexiGov AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
