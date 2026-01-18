"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { FileText, Plus, Search, Filter, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Input } from "@workspace/ui/components/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { draftsApi } from "@/lib/api"

interface Draft {
  id: string
  title: string
  documentType: string
  status: string
  createdAt: string
  updatedAt: string
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadDrafts()
  }, [])

  const loadDrafts = async () => {
    try {
      setIsLoading(true)
      const response = await draftsApi.list()
      if (response.success && response.data) {
        setDrafts((response.data as { drafts: Draft[] }).drafts || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drafts")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this draft?")) return
    
    try {
      await draftsApi.delete(id)
      setDrafts(drafts.filter((d) => d.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete draft")
    }
  }

  const filteredDrafts = drafts.filter((draft) =>
    draft.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      IN_REVIEW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.DRAFT}`}>
        {status.replace("_", " ")}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Drafts</h1>
          <p className="text-muted-foreground">
            Create and manage your ordinance drafts
          </p>
        </div>
        <Button asChild>
          <Link href="/drafts/new">
            <Plus className="mr-2 h-4 w-4" />
            New Draft
          </Link>
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search drafts..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredDrafts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No drafts yet</CardTitle>
            <CardDescription className="text-center mb-4">
              Get started by creating your first ordinance draft.
              <br />
              Use AI to help you generate compliant ordinances.
            </CardDescription>
            <Button asChild>
              <Link href="/drafts/new">
                <Plus className="mr-2 h-4 w-4" />
                Create First Draft
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Drafts List */}
      {!isLoading && filteredDrafts.length > 0 && (
        <div className="grid gap-4">
          {filteredDrafts.map((draft) => (
            <Card key={draft.id} className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex-1">
                  <Link href={`/drafts/${draft.id}`} className="hover:underline">
                    <CardTitle className="text-lg">{draft.title}</CardTitle>
                  </Link>
                  <CardDescription className="mt-1">
                    {draft.documentType.replace(/_/g, " ")} • Created {formatDate(draft.createdAt)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(draft.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/drafts/${draft.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(draft.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
