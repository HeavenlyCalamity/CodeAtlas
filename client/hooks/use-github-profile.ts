"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { GithubProfile } from "@/lib/api";

export function useGithubProfile() {
  return useQuery({
    queryKey: queryKeys.github.profile(),
    queryFn: async () => {
      const profile = await api.githubProfile();
      return profile;
    },
    // The profile is tied to the signed-in user, so refetch on window focus
    // and keep it fresh while the profile page is open.
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export type { GithubProfile };
