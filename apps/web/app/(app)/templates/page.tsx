"use client"

import { Button } from "@workspace/ui/components/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { FolderOpen, Search, Filter } from "lucide-react"
import { Input } from "@workspace/ui/components/input"

const templateCategories = [
  { name: "Tax Ordinances", count: 12 },
  { name: "Regulatory Ordinances", count: 8 },
  { name: "Environmental Ordinances", count: 6 },
  { name: "Public Safety", count: 5 },
  { name: "Zoning Ordinances", count: 4 },
  { name: "Budget Ordinances", count: 3 },
]

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
        <p className="text-muted-foreground">
          Browse and use ordinance templates for your LGU
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search templates..." className="pl-9" />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Template Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templateCategories.map((category) => (
          <Card key={category.name} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <CardDescription>{category.count} templates</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
