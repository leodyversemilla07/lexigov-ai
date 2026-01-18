"use client"

import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Download, FileText, File, FileSpreadsheet } from "lucide-react"

const exportFormats = [
  {
    name: "Word Document",
    description: "Export as .docx file for editing",
    icon: FileText,
    format: "docx",
  },
  {
    name: "PDF",
    description: "Export as PDF for printing and sharing",
    icon: File,
    format: "pdf",
  },
  {
    name: "Plain Text",
    description: "Export as plain text file",
    icon: FileSpreadsheet,
    format: "txt",
  },
]

export default function ExportPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Export</h1>
        <p className="text-muted-foreground">
          Export your ordinance drafts in various formats
        </p>
      </div>

      {/* Select Draft */}
      <Card>
        <CardHeader>
          <CardTitle>Select Draft to Export</CardTitle>
          <CardDescription>
            Choose a draft from your library to export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full h-24 border-dashed">
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <span className="text-muted-foreground">Select a draft</span>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Export Formats */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Export Format</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {exportFormats.map((format) => (
            <Card
              key={format.format}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <format.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{format.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {format.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button size="lg" disabled>
          <Download className="mr-2 h-4 w-4" />
          Export Draft
        </Button>
      </div>
    </div>
  )
}
