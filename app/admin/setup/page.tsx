"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default function AdminSetupPage() {
  const [setupKey, setSetupKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; credentials?: any } | null>(null)

  const handleSetup = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/create-default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupKey }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ success: false, message: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>Reset or create the default admin user</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Setup Key</label>
            <Input
              type="password"
              placeholder="Enter setup key"
              value={setupKey}
              onChange={(e) => setSetupKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSetup()}
            />
            <p className="text-xs text-gray-500">Default key: setup-admin-2024</p>
          </div>

          <Button onClick={handleSetup} disabled={loading || !setupKey} className="w-full">
            {loading ? "Setting up..." : "Setup Admin User"}
          </Button>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    {result.message}
                    {result.success && result.credentials && (
                      <div className="mt-2 p-2 bg-white rounded text-sm font-mono">
                        <div>Email: {result.credentials.email}</div>
                        <div>Password: {result.credentials.password}</div>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {result?.success && (
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => (window.location.href = "/admin/login")}
            >
              Go to Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
