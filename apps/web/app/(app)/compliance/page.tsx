"use client"

import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Scale, CheckCircle, AlertTriangle, XCircle, FileText } from "lucide-react"

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance Check</h1>
        <p className="text-muted-foreground">
          Verify your drafts against Philippine laws and regulations
        </p>
      </div>

      {/* Compliance Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Total Checks</CardDescription>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Passed</CardDescription>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Warnings</CardDescription>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardDescription>Failed</CardDescription>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Select Draft for Compliance Check */}
      <Card>
        <CardHeader>
          <CardTitle>Run Compliance Check</CardTitle>
          <CardDescription>
            Select a draft to verify against applicable laws and regulations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full h-24 border-dashed">
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <span className="text-muted-foreground">Select a draft to check</span>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Applicable Laws */}
      <Card>
        <CardHeader>
          <CardTitle>Applicable Laws & Regulations</CardTitle>
          <CardDescription>
            Laws that will be checked for compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Republic Act 7160 (Local Government Code)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Philippine Constitution
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              DILG Memorandum Circulars
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
