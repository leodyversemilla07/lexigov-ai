"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { ArrowLeft, Loader2, Save, Sparkles, CheckCircle } from "lucide-react"
import { draftsApi } from "@/lib/api"

interface Draft {
  id: string
  title: string
  documentType: string
  status: string
  content: {
    description?: string
    sections?: Array<{
      title: string
      content: string
    }>
    body?: string
  }
  createdAt: string
  updatedAt: string
}

export default function DraftEditorPage() {
  const router = useRouter()
  const params = useParams()
  const draftId = params.id as string

  const [draft, setDraft] = useState<Draft | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    content: "",
  })

  useEffect(() => {
    loadDraft()
  }, [draftId])

  const loadDraft = async () => {
    try {
      setIsLoading(true)
      const response = await draftsApi.get(draftId)
      if (response.success && response.data) {
        const draftData = (response.data as { draft: Draft }).draft
        setDraft(draftData)
        setFormData({
          title: draftData.title,
          content: draftData.content?.body || draftData.content?.description || "",
        })
      } else {
        setError("Draft not found")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load draft")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!draft) return

    setIsSaving(true)
    setSaveSuccess(false)
    setError(null)

    try {
      const response = await draftsApi.update(draft.id, {
        title: formData.title,
        content: {
          ...draft.content,
          body: formData.content,
        },
      })

      if (response.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setError(response.error || "Failed to save draft")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !draft) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/drafts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Draft Not Found</h1>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground text-center">{error}</p>
            <div className="flex justify-center mt-4">
              <Button asChild>
                <Link href="/drafts">Back to Drafts</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/drafts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Draft</h1>
            <p className="text-muted-foreground">
              {draft?.documentType.replace(/_/g, " ")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center text-sm text-green-600">
              <CheckCircle className="mr-1 h-4 w-4" />
              Saved
            </span>
          )}
          <Button variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            AI Assist
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
          {error}
        </div>
      )}

      {/* Editor */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ordinance Content</CardTitle>
              <CardDescription>
                Write or edit your ordinance draft content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={20}
                  className="font-mono text-sm"
                  placeholder="Start writing your ordinance here..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Draft Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{draft?.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">
                  {draft && new Date(draft.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium">
                  {draft && new Date(draft.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/compliance?draft=${draft?.id}`}>
                  Run Compliance Check
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/export?draft=${draft?.id}`}>
                  Export Draft
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
