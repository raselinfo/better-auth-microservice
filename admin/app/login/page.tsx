"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")
    const router = useRouter()

    const handleSignIn = async () => {
        setLoading(true)
        setMessage("")
        try {
            await authClient.signIn.magicLink({
                email,
                callbackURL: "http://localhost:3001" // Redirect back to admin dashboard
            })
            setMessage("Magic link sent! Check your email.")
        } catch (error) {
            setMessage("Failed to send magic link")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        await authClient.signIn.social({
            provider: "google",
            callbackURL: "http://localhost:3001"
        })
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Admin Login</CardTitle>
                    <CardDescription>Sign in to access the dashboard</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            placeholder="admin@example.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    {message && <p className="text-sm text-green-600">{message}</p>}
                    <Button className="w-full" onClick={handleSignIn} disabled={loading}>
                        {loading ? "Sending..." : "Sign in with Magic Link"}
                    </Button>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
                        Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
