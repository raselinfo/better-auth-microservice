"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RoleList } from "@/features/roles/RoleList"
import { PermissionList } from "@/features/permission/PermissionList"

export default function RolesPage() {
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Roles & Permissions</h1>
            
            <Tabs defaultValue="roles" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="roles">Roles</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>
                <TabsContent value="roles" className="space-y-4">
                    <RoleList />
                </TabsContent>
                <TabsContent value="permissions" className="space-y-4">
                    <PermissionList />
                </TabsContent>
            </Tabs>
        </div>
    )
}