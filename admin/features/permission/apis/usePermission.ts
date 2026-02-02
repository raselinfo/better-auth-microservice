import { authClient } from "@/lib/auth-client";
import { APIError } from "better-auth";
import { useEffect, useState } from "react";

export type Permission = {
    id: string;
    name: string;
    value: string;
    description: string | null;
    isExclusive: boolean | null;
};

export const usePermissionList = () => {
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const { data } = await authClient.$fetch<Permission[]>("/admin/permissions");
            setPermissions(data || []);
        } catch (error) {
            console.error("Error fetching permissions:", error);
            if (error instanceof APIError) {
                setError(error.message);
            } else {
                setError("Failed to fetch permissions");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    return {
        permissions,
        loading,
        error,
        refetch: fetchPermissions
    };
};