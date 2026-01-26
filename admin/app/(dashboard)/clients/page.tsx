"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { authClient } from "@/lib/auth-client"
import { Copy, Eye, EyeOff, Loader2, Plus, Trash } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface OAuthClient {
    id: string
    name: string
    clientId: string
    clientSecret?: string
    createdAt: Date
    redirectUris?: string
}

export default function ClientsPage() {
    const [clients, setClients] = useState<OAuthClient[]>([])
    const [loading, setLoading] = useState(false)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newClientName, setNewClientName] = useState("")
    const [newClientRedirectUris, setNewClientRedirectUris] = useState("")
    const [createdClient, setCreatedClient] = useState<{ clientId: string, clientSecret: string } | null>(null)
    const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({})

    const toggleSecretVisibility = (id: string) => {
        setVisibleSecrets(prev => ({
            ...prev,
            [id]: !prev[id]
        }))
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        // You could add a toast here
    }

    const fetchClients = async () => {
        setLoading(true)
        try {
            const res = await fetch("http://localhost:4000/api/admin/clients", {
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include" // Important for cross-origin cookies
            })
            if (res.ok) {
                const data = await res.json()
                setClients(data.map((c: { id: string, name: string, clientId: string, clientSecret?: string, createdAt: string, redirectUris?: string }) => ({
                    id: c.id,
                    name: c.name,
                    clientId: c.clientId,
                    clientSecret: c.clientSecret,
                    createdAt: new Date(c.createdAt),
                    redirectUris: c.redirectUris
                })))
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchClients()
    }, [])

    const handleCreateClient = async () => {
        setLoading(true)
        try {
            const res = await fetch("http://localhost:4000/api/admin/clients", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    name: newClientName,
                    redirectUris: newClientRedirectUris
                })
            })
            
            const data = await res.json()
            
            if (res.ok && data.client) {
                setCreatedClient({
                    clientId: data.client.clientId,
                    clientSecret: data.clientSecret || "Hidden" // If secret is not returned (hashed), warn user. But my endpoint returns it.
                })
                fetchClients()
            } else {
                console.error(data.error)
            }
        } catch (error) {
            console.error("Failed to create client", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteClient = async (id: string) => {
        if (!confirm("Are you sure you want to delete this client?")) return
        // TODO: Implement delete endpoint
        alert("Delete not implemented yet")
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">M2M Clients</h1>
                <Dialog open={isCreateOpen} onOpenChange={(open) => {
                    setIsCreateOpen(open)
                    if (!open) {
                        setCreatedClient(null)
                        setNewClientName("")
                        setNewClientRedirectUris("")
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Client
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create OAuth Client</DialogTitle>
                            <DialogDescription>
                                Create a new client for machine-to-machine authentication.
                            </DialogDescription>
                        </DialogHeader>
                        
                        {!createdClient ? (
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={newClientName}
                                        onChange={(e) => setNewClientName(e.target.value)}
                                        className="col-span-3"
                                        placeholder="Service Name"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="uris" className="text-right">
                                        Redirect URIs
                                    </Label>
                                    <Input
                                        id="uris"
                                        value={newClientRedirectUris}
                                        onChange={(e) => setNewClientRedirectUris(e.target.value)}
                                        className="col-span-3"
                                        placeholder="https://app.com/callback (comma separated)"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Client ID</Label>
                                    <div className="p-3 bg-muted rounded-md font-mono text-sm select-all">
                                        {createdClient.clientId}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Client Secret</Label>
                                    <div className="p-3 bg-muted rounded-md font-mono text-sm break-all select-all">
                                        {createdClient.clientSecret}
                                    </div>
                                </div>
                                <p className="text-sm text-yellow-600 font-medium">
                                    Copy these credentials now. The secret will not be shown again.
                                </p>
                            </div>
                        )}

                        <DialogFooter>
                            {!createdClient ? (
                                <Button onClick={handleCreateClient} disabled={loading || !newClientName}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Client"}
                                </Button>
                            ) : (
                                <Button onClick={() => setIsCreateOpen(false)}>
                                    Done
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>OAuth Clients</CardTitle>
                    <CardDescription>Manage clients for machine-to-machine authentication.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading && clients.length === 0 ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Client ID</TableHead>
                                        <TableHead>Client Secret</TableHead>
                                        <TableHead>Redirect URIs</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clients.map((client) => (
                                        <TableRow key={client.id}>
                                            <TableCell className="font-medium">{client.name}</TableCell>
                                            <TableCell className="font-mono text-xs">{client.clientId}</TableCell>
                                            <TableCell className="font-mono text-xs">
                                                <div className="flex items-center space-x-2">
                                                    <span>
                                                        {visibleSecrets[client.id] ? (client.clientSecret || "Hidden") : "••••••••••••••••••••••••••••••••"}
                                                    </span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleSecretVisibility(client.id)}>
                                                        {visibleSecrets[client.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                    </Button>
                                                    {visibleSecrets[client.id] && client.clientSecret && (
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(client.clientSecret!)}>
                                                            <Copy className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[200px] truncate">{client.redirectUris || "-"}</TableCell>
                                            <TableCell>{client.createdAt.toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteClient(client.id)} title="Delete Client">
                                                    <Trash className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {clients.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center">No clients found</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
