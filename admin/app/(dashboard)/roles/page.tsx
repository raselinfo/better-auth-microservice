"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const roles = [
    {
        name: "admin",
        permissions: ["create", "read", "update", "delete", "manage_roles", "manage_settings"],
        description: "Full access to all resources"
    },
    {
        name: "user",
        permissions: ["read", "update_own"],
        description: "Standard user access"
    }
]

export default function RolesPage() {
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Roles & Permissions</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Defined Roles</CardTitle>
                    <CardDescription>
                        Roles and their associated permissions (managed in system configuration).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role Name</TableHead>
                                <TableHead>Permissions</TableHead>
                                <TableHead>Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roles.map((role) => (
                                <TableRow key={role.name}>
                                    <TableCell className="font-medium">{role.name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {role.permissions.map((perm) => (
                                                <Badge key={perm} variant="outline" className="text-xs">
                                                    {perm}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>{role.description}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
