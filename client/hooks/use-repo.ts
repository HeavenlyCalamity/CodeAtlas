"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "@/components/ui/toast";
import { api, type Repository } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

const INDEXING_POLL_MS = 2_000;

function hasIndexingRepos(repos: Repository[] | undefined) {
  return (
    repos?.some(
      (repo) => repo.indexStatus === "PENDING" || repo.indexStatus === "INDEXING",
    ) ?? false
  );
}

function updateRepoInListCache(
  queryClient: ReturnType<typeof useQueryClient>,
  repo: Repository,
) {
  queryClient.setQueryData<Repository[]>(
    queryKeys.repos.list(),
    (current) =>
      current?.map((item) => (item.id === repo.id ? repo : item)) ?? current,
  );
}

export function useRepos() {
  return useQuery({
    queryKey: queryKeys.repos.list(),
    queryFn: async () => {
      const repos = await api.listRepos(false);
      return repos.length === 0 ? api.listRepos(true) : repos;
    },
    staleTime: 30_000,
    refetchInterval: (query) =>
      hasIndexingRepos(query.state.data) ? INDEXING_POLL_MS : false,
  });
}

export function useRepository(repoId: string) {
  return useQuery({
    queryKey: queryKeys.repos.detail(repoId),
    queryFn: () => api.getRepo(repoId),
    enabled: Boolean(repoId),
    refetchInterval: (query) =>
      query.state.data?.indexStatus === "PENDING" ||
      query.state.data?.indexStatus === "INDEXING"
        ? INDEXING_POLL_MS
        : false,
  });
}

export function useIndexStatus(repoId: string, enabled = false) {
  return useQuery({
    queryKey: queryKeys.repos.status(repoId),
    queryFn: () => api.indexStatus(repoId),
    enabled: Boolean(repoId) && enabled,
    refetchInterval: (query) =>
      query.state.data?.indexStatus === "PENDING" ||
      query.state.data?.indexStatus === "INDEXING"
        ? 1_500
        : false,
  });
}

export function useStartIndexing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (repoId: string) => {
      await api.startIndex(repoId);
      return api.getRepo(repoId);
    },
    onSuccess: (repo) => {
      queryClient.setQueryData(queryKeys.repos.detail(repo.id), repo);
      updateRepoInListCache(queryClient, repo);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.repos.status(repo.id),
      });
      toast.add({
        title: "Indexing started",
        description: `Indexing ${repo.fullName}...`,
        type: "loading",
      });
    },
    onError: (error: Error) => {
      toast.add({
        title: "Could not start indexing",
        description: error.message,
        type: "error",
      });
    },
  });
}

export function useRefreshRepos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.listRepos(true),
    onSuccess: (repos) => {
      queryClient.setQueryData(queryKeys.repos.list(), repos);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.repos.list(),
      });
      toast.add({
        title: "Sync successful",
        description: `${repos.length} repositories loaded`,
        type: "success",
      });
    },
    onError: (error: Error) => {
      toast.add({
        title: "Sync failed",
        description: error.message,
        type: "error",
      });
    },
  });
}

export function useImportRepo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => api.importRepo(url),
    onSuccess: (repo) => {
      queryClient.setQueryData<Repository[]>(
        queryKeys.repos.list(),
        (current) => {
          const withoutImported = current?.filter((item) => item.id !== repo.id) ?? [];
          return [...withoutImported, repo].sort((a, b) =>
            a.fullName.localeCompare(b.fullName),
          );
        },
      );
      queryClient.setQueryData(queryKeys.repos.detail(repo.id), repo);
      toast.add({
        title: "Repository added",
        description: `${repo.fullName} is now available in your workspace.`,
        type: "success",
      });
    },
    onError: (error: Error) => {
      toast.add({
        title: "Could not add repository",
        description: error.message,
        type: "error",
      });
    },
  });
}

export function getRepoProgress(
  repo: Pick<Repository, "filesProcessed" | "filesTotal">,
) {
  if (!repo.filesTotal) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((repo.filesProcessed / repo.filesTotal) * 100),
  );
}
