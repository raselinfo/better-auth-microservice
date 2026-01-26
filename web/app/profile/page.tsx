"use client"

import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type Session = typeof authClient.$Infer.Session.session
type User = typeof authClient.$Infer.Session.user
type Account = {
    id: string
    userId: string
    accountId: string
    providerId: string
    createdAt: Date
    updatedAt: Date
}

export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession()
  const [sessions, setSessions] = useState<Session[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [name, setName] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/sign-in")
    } else if (session) {
        setName(session.user.name || "")
    }
  }, [session, isPending, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sessionData = await authClient.listSessions()
        setSessions(sessionData.data || [])
        
        const accountData = await authClient.listAccounts()
        setAccounts(accountData.data || [])
      } catch (e) {
        console.error("Failed to fetch data", e)
      }
    }
    if (session) {
        fetchData()
    }
  }, [session])

  const handleSignOut = async () => {
    await authClient.signOut({
        fetchOptions: {
            onSuccess: () => {
                router.push("/auth/sign-in")
            }
        }
    })
  }

  const handleUpdateProfile = async () => {
      setIsUpdating(true)
      try {
          await authClient.updateUser({
              name,
              
          })
          toast.success("Profile updated successfully")
      } catch (e: unknown) {
          if (e instanceof Error) {
              toast.error(e.message || "Failed to update profile")
          } else {
              toast.error("Failed to update profile")
          }
      } finally {
          setIsUpdating(false)
      }
  }

  const handleRevokeSession = async (token: string) => {
    try {
      await authClient.revokeSession({ token })
      setSessions(sessions.filter(s => s.token !== token))
      toast.success("Session revoked")
    } catch {
      toast.error("Failed to revoke session")
    }
  }

  const handleLinkAccount = async (provider: "google" | "facebook") => {
    try {
        await authClient.linkSocial({
            provider,
            callbackURL: "/profile"
        })
    } catch (e: unknown) {
        if (e instanceof Error) {
             toast.error(e.message || "Failed to link account")
        } else {
             toast.error("Failed to link account")
        }
    }
  }

  const handleUnlinkAccount = async (providerId: string) => {
      try {
          await authClient.unlinkAccount({ providerId })
          setAccounts(accounts.filter(a => a.providerId !== providerId))
          toast.success("Account unlinked")
      } catch (e: unknown) {
          if (e instanceof Error) {
               toast.error(e.message || "Failed to unlink account")
          } else {
               toast.error("Failed to unlink account")
          }
      }
  }

  if (isPending) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl space-y-8 p-4">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={session.user.image || ""} />
            <AvatarFallback>{session.user.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{session.user.name}</CardTitle>
            <CardDescription>{session.user.email}</CardDescription>
            <div className="mt-2 flex gap-2">
                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                    Role: {session.user.role || "user"}
                </span>
            </div>
          </div>
          <Button variant="destructive" className="ml-auto" onClick={handleSignOut}>
            Sign Out
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" />
                </div>
                <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                    {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>Manage your active sessions on other devices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {sessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="text-sm">
                            <p className="font-medium">{s.userAgent || "Unknown Device"}</p>
                            <p className="text-muted-foreground text-xs">{new Date(s.createdAt).toLocaleString()}</p>
                            {s.id === session.session.id && (
                                <span className="text-green-600 text-xs font-bold">Current Session</span>
                            )}
                        </div>
                        {s.id !== session.session.id && (
                            <Button variant="outline" size="sm" onClick={() => handleRevokeSession(s.token)}>
                                Revoke
                            </Button>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Linked Accounts</CardTitle>
                <CardDescription>Manage your linked social accounts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {accounts.map((account) => (
                     <div key={account.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="text-sm font-medium capitalize">
                            {account.providerId}
                        </div>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleUnlinkAccount(account.providerId)}>
                            Unlink
                        </Button>
                    </div>
                ))}
                <Separator />
                <div className="flex gap-2">
                    {!accounts.find(a => a.providerId === 'google') && (
                         <Button variant="outline" className="w-full" onClick={() => handleLinkAccount("google")}>
                            Link Google
                        </Button>
                    )}
                    {/* Add Facebook if needed */}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
