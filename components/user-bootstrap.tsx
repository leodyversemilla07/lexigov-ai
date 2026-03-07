"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function UserBootstrap() {
  const { isLoaded, userId } = useAuth();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const ensureCurrentUser = useMutation(api.users.ensureCurrentUser);
  const lastEnsuredUserId = useRef<string | null>(null);

  useEffect(() => {
    if (
      !isLoaded ||
      isLoading ||
      !isAuthenticated ||
      !userId ||
      lastEnsuredUserId.current === userId
    ) {
      return;
    }

    lastEnsuredUserId.current = userId;
    void ensureCurrentUser({}).catch((error) => {
      console.error("Failed to ensure current user", error);
      lastEnsuredUserId.current = null;
    });
  }, [ensureCurrentUser, isAuthenticated, isLoaded, isLoading, userId]);

  return null;
}
