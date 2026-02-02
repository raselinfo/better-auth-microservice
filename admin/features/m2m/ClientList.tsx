"use client";

import React, { useState } from "react";
import { useClientList, useCreateClient, CreateClientResponse } from "./api/useM2M";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,

} from "@/components/ui/dialog";
import { Loader2, Plus, Copy, Check, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const ClientList = () => {
    const { clients, loading, error, refetch } = useClientList();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

    const toggleSecretVisibility = (id: string) => {
        setVisibleSecrets((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const handleCopySecret = (secret: string) => {
        navigator.clipboard.writeText(secret);
        toast.success("Secret copied to clipboard");
    };

    if (error) {
        return <div className="text-red-500">Error: {error}</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">M2M Clients</h1>
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Client
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Client ID</TableHead>
                            <TableHead>Client Secret</TableHead>
                            <TableHead>Redirect URIs</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex justify-center items-center">
                                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                        Loading clients...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No clients found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">{client.name}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {client.clientId}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        <div className="flex items-center space-x-2">
                                            <span>
                                                {visibleSecrets[client.id]
                                                    ? client.clientSecret || "Hidden"
                                                    : "••••••••••••••••••••••••••••••••"}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => toggleSecretVisibility(client.id)}
                                            >
                                                {visibleSecrets[client.id] ? (
                                                    <EyeOff className="h-3 w-3" />
                                                ) : (
                                                    <Eye className="h-3 w-3" />
                                                )}
                                            </Button>
                                            {visibleSecrets[client.id] && client.clientSecret && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => handleCopySecret(client.clientSecret!)}
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {client.redirectUris ? (
                                            <div className="flex flex-wrap gap-1">
                                                {client.redirectUris.split(",").map((uri, i) => (
                                                    <Badge key={i} variant="secondary" className="text-xs">
                                                        {uri.trim()}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs">None</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(client.createdAt), "PP")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {/* Add actions like Delete/Edit later if needed */}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <CreateClientDialog 
                open={isCreateOpen} 
                onOpenChange={setIsCreateOpen} 
                onSuccess={() => {
                    refetch();
                }}
            />
        </div>
    );
};

const CreateClientDialog = ({ 
    open, 
    onOpenChange, 
    onSuccess 
}: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}) => {
    const { createClient, loading } = useCreateClient();
    const [name, setName] = useState("");
    const [redirectUris, setRedirectUris] = useState("");
    const [newClientData, setNewClientData] = useState<CreateClientResponse | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const uris = redirectUris
                .split(",")
                .map((u) => u.trim())
                .filter((u) => u.length > 0);

            const result = await createClient({
                name,
                redirectUris: uris.length > 0 ? uris : undefined,
            });

            setNewClientData(result);
            onSuccess();
        } catch (error) {
            // Error is handled by the hook (toast)
        }
    };

    const handleClose = () => {
        if (!newClientData) {
            onOpenChange(false);
            // Reset form
            setName("");
            setRedirectUris("");
        } else {
            // If showing credentials, closing should reset everything
            setNewClientData(null);
            setName("");
            setRedirectUris("");
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {newClientData ? "Client Created Successfully" : "Create M2M Client"}
                    </DialogTitle>
                    <DialogDescription>
                        {newClientData 
                            ? "Please copy the client secret now. You won't be able to see it again."
                            : "Create a new Machine-to-Machine (M2M) client for API access."}
                    </DialogDescription>
                </DialogHeader>

                {newClientData ? (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Client ID</Label>
                            <div className="flex items-center space-x-2">
                                <Input value={newClientData.client.clientId} readOnly />
                                <CopyButton value={newClientData.client.clientId} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Client Secret</Label>
                            <div className="flex items-center space-x-2">
                                <Input value={newClientData.clientSecret} readOnly className="font-mono" />
                                <CopyButton value={newClientData.clientSecret} />
                            </div>
                            <p className="text-sm text-red-500 font-medium mt-2">
                                Store this secret securely! It will not be shown again.
                            </p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Client Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Billing Service"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                minLength={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="redirectUris">Redirect URIs (Optional)</Label>
                            <Input
                                id="redirectUris"
                                placeholder="https://app.example.com/callback, https://..."
                                value={redirectUris}
                                onChange={(e) => setRedirectUris(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Comma-separated list of allowed redirect URIs.
                            </p>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Client
                            </Button>
                        </DialogFooter>
                    </form>
                )}

                {newClientData && (
                    <DialogFooter>
                        <Button onClick={handleClose}>
                            Done
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
};

const CopyButton = ({ value }: { value: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button size="icon" variant="outline" onClick={handleCopy} type="button">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
    );
};
