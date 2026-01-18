"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { ArrowLeft, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"
import { draftsApi } from "@/lib/api"

const documentTypes = [
  { value: "tax_ordinance", label: "Tax Ordinance" },
  { value: "regulatory_ordinance", label: "Regulatory Ordinance" },
  { value: "environmental_ordinance", label: "Environmental Ordinance" },
  { value: "zoning_ordinance", label: "Zoning Ordinance" },
  { value: "public_safety", label: "Public Safety Ordinance" },
  { value: "budget_ordinance", label: "Budget Ordinance" },
  { value: "other", label: "Other" },
]

export default function NewDraftPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    documentType: "tax_ordinance",
    description: "",
    useAI: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await draftsApi.create({
        title: formData.title,
        documentType: formData.documentType,
        content: {
          description: formData.description,
          sections: [],
        },
      })

      if (response.success && response.data) {
        // Navigate to the draft editor
        router.push(`/drafts/${(response.data as { id: string }).id}`)
      } else {
        setError(response.error || "Failed to create draft")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create draft")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/drafts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Draft</h1>
          <p className="text-muted-foreground">
            Start a new ordinance draft from scratch or use AI assistance
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Draft Details</CardTitle>
            <CardDescription>
              Provide the basic information for your ordinance draft
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Ordinance Imposing Regulatory Fees on Business Establishments"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <select
                id="documentType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Briefly describe the purpose and scope of this ordinance..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This description will help AI generate more relevant content if you choose to use AI assistance.
              </p>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
              <input
                type="checkbox"
                id="useAI"
                checked={formData.useAI}
                onChange={(e) => setFormData({ ...formData, useAI: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <div className="flex-1">
                <Label htmlFor="useAI" className="flex items-center gap-2 cursor-pointer">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Use AI to generate initial draft
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  AI will create a compliant ordinance structure based on your inputs
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/drafts">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isLoading || !formData.title}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Draft"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
