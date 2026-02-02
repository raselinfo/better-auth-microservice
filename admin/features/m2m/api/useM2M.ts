import { authClient } from "@/lib/auth-client";
import { APIError } from "better-auth";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export type OAuthClient = {
    id: string;
    clientId: string;
    name: string;
    redirectUris: string | null;
    createdAt: Date;
    updatedAt: Date;
    clientSecret?: string | null; // Only present if returned by API (e.g. after creation or if we decide to expose it)
    metadata?: string | null;
};

export type CreateClientInput = {
    name: string;
    redirectUris?: string[];
};

export type CreateClientResponse = {
    client: OAuthClient;
    clientSecret: string;
};

export const useClientList = () => {
    const [clients, setClients] = useState<OAuthClient[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchClients = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await authClient.$fetch<OAuthClient[]>("/admin/m2m/client", {
                method: "GET"
            });
            if (error) {
                throw error;
            }
            if (data) {
                setClients(data);
            }
        } catch (error) {
            if(error instanceof APIError){
                toast.error(error.message || "Failed to fetch clients");
                setError(error.message || "Failed to fetch clients");
                return;
            }
            console.error("Error fetching clients:", error);
            setError( "Failed to fetch clients");
            toast.error("Failed to fetch clients");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    return {
        clients,
        loading,
        error,
        refetch: fetchClients
    };
};

export const useCreateClient = () => {
    const [loading, setLoading] = useState(false);
    

    const createClient = async (input: CreateClientInput) => {
        setLoading(true);
        try {
            const { data, error } = await authClient.$fetch<CreateClientResponse>("/admin/m2m/client", {
                method: "POST",
                body: input
            });

            if (error) {
                throw error;
            }

            toast.success("Client created successfully");
            return data;
        } catch (error) {
            if(error instanceof APIError){
                toast.error(error.message || "Failed to create client");
throw error
            }
            console.error("Error creating client:", error);
          
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        createClient,
        loading
    };
};
