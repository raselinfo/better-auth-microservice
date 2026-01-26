"use client"

import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Ban, CheckCircle } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface User {
    id: string
    email: string
    name?: string
    role?: string
    banned?: boolean
    permissions?: string
    properties?: string // JSON string
    createdAt: string | Date
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    
    // Edit form state
    const [editRole, setEditRole] = useState<"user" | "admin">("user")
    const [editPermissions, setEditPermissions] = useState("")
    const [editProperties, setEditProperties] = useState("")
    
    const [updating, setUpdating] = useState(false)
    
    const fetchUsers = async () => {
        setLoading(true)
        try {
            const { data } = await authClient.admin.listUsers({
                query: {
                    limit: 100,
                }
            })
            if (data) {
                setUsers(data.users as unknown as User[])
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleEditClick = (user: User) => {
        setSelectedUser(user)
        setEditRole((user.role as "user" | "admin") || "user")
        setEditPermissions(user.permissions || "")
        setEditProperties(user.properties ? (typeof user.properties === 'string' ? user.properties : JSON.stringify(user.properties, null, 2)) : "")
        setIsEditOpen(true)
    }

    const handleBanUser = async (userId: string, ban: boolean) => {
        try {
            if (ban) {
                await authClient.admin.banUser({ userId })
            } else {
                await authClient.admin.unbanUser({ userId })
            }
            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, banned: ban } : u))
            if (selectedUser?.id === userId) {
                setSelectedUser({ ...selectedUser, banned: ban })
            }
        } catch (error) {
            console.error("Failed to ban/unban user", error)
        }
    }

    const handleSaveUser = async () => {
        if (!selectedUser) return
        setUpdating(true)
        try {
            // Update Role
            if (selectedUser.role !== editRole) {
                await authClient.admin.setRole({
                    userId: selectedUser.id,
                    role: editRole
                })
            }
            
            // Update custom fields (permissions, properties)
            // Note: better-auth admin plugin might not expose generic update. 
            // We might need a custom endpoint for this. 
            // For now, let's try calling a custom endpoint we will create.
            await fetch("http://localhost:4000/api/admin/user/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    userId: selectedUser.id,
                    permissions: editPermissions,
                    properties: editProperties ? JSON.parse(editProperties) : null
                })
            })

            // Refresh list
            await fetchUsers()
            setIsEditOpen(false)
        } catch (error) {
            console.error("Failed to update user", error)
            alert("Failed to update user. Check console for details.")
        } finally {
            setUpdating(false)
        }
    }

    const filteredUsers = users.filter(user => 
        user.email.toLowerCase().includes(search.toLowerCase()) || 
        user.name?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Users</h1>
                <Button onClick={fetchUsers} variant="outline" size="sm">
                    <Loader2 className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.name || "N/A"}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                            {user.role || "user"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.banned ? (
                                            <Badge variant="destructive">Banned</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => handleEditClick(user)}
                                        >
                                            Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user details and permissions.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedUser && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Email</Label>
                                <div className="col-span-3 text-sm">{selectedUser.email}</div>
                            </div>
                            
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">Role</Label>
                                <Select 
                                    value={editRole} 
                                    onValueChange={(val: "user" | "admin") => setEditRole(val)}
                                >
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="user">User</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="permissions" className="text-right">Permissions</Label>
                                <Input
                                    id="permissions"
                                    value={editPermissions}
                                    onChange={(e) => setEditPermissions(e.target.value)}
                                    className="col-span-3"
                                    placeholder="Comma separated (e.g. read,write)"
                                />
                            </div>

                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="properties" className="text-right mt-2">Properties</Label>
                                <Textarea
                                    id="properties"
                                    value={editProperties}
                                    onChange={(e) => setEditProperties(e.target.value)}
                                    className="col-span-3"
                                    placeholder='JSON format (e.g. {"department": "IT"})'
                                    rows={4}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Status</Label>
                                <div className="col-span-3 flex items-center space-x-2">
                                    {selectedUser.banned ? (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleBanUser(selectedUser.id, false)}
                                            className="text-green-600 border-green-600 hover:text-green-700 hover:bg-green-50"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Unban User
                                        </Button>
                                    ) : (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleBanUser(selectedUser.id, true)}
                                            className="text-red-600 border-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Ban className="w-4 h-4 mr-2" />
                                            Ban User
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveUser} disabled={updating}>
                            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
