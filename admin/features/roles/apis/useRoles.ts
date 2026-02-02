import { authClient } from "@/lib/auth-client";
import { APIError } from "better-auth";
import { useEffect, useState } from "react";

export type Role = {
    id: string;
    name: string;
    value: string;
    description: string | null;
    isActive: boolean | null;
    parentId: string | null;
    order: number | null;
};

export const useRoleList = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const { data } = await authClient.$fetch<Role[]>("/admin/roles");
            setRoles(data || []);
        } catch (error) {
            console.error("Error fetching roles:", error);
            if (error instanceof APIError) {
                setError(error.message);
            } else {
                setError("Failed to fetch roles");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    return {
        roles,
        loading,
        error,
        refetch: fetchRoles
    };
};