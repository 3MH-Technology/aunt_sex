"use client";
import { useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";

  return { user, isLoading, isAuthenticated };
}
