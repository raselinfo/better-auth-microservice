import { authClient } from "@/lib/auth-client";
import { APIError } from "better-auth";
import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
  properties: unknown;
};

type UserResponse = {
  users: User[];
  total: number;
};

export const useUserList = () => {
  const [usersData, setUsersData] = useState<UserResponse>({
    users: [],
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await authClient.$fetch<UserResponse>("/admin/users");
      setUsersData(
        data || {
          users: [],
          total: 0,
        },
      );
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error instanceof APIError) {
        setError(error?.message || "Failed to fetch users");
      } else {
        setError("Failed to fetch users");
      }
      
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    data: usersData || [],
    loading,
    error,
  };
};
