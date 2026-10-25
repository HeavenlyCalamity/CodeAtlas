"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api,ApiError } from "@/lib/api";
import {queryKeys} from "@/lib/query-keys";

export const AUTH_COOKIE = "devpilot_auth";

export function setAuthCookie(authed: boolean){
    if (typeof document === "undefined") return;
    if (authed) {
        document.cookie = `${AUTH_COOKIE}=true; path=/; max-age=31536000; SameSite=Lax`; // 1 year
    } else {
        document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`; // Expire immediately
    }
}

export function useCurrentUser() {
    return useQuery({
        queryKey: ["currentUser"],
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 minutes — prevents refetch loops on login page
        queryFn: async () => {
            try {
                const user = await api.me();
                setAuthCookie(true);
                return user;
            } catch (error) {
                setAuthCookie(false);
                throw error;
            }
        }
    });
}

export function useLogout() {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: async () => {
            await api.logout();
        },
            onSuccess: () => {
                setAuthCookie(false);
                queryClient.invalidateQueries({ queryKey: queryKeys.auth.all});
                router.replace("/login");

            }})}