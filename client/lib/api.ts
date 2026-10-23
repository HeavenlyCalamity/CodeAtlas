export type IndexStatus = "PENDING" | "INDEXING" | "READY" | "FAILED";

export type Repository = {
    id: string;
    name: string;
    owner: string;
    fullName: string;
    description: string | null;
    url: string;
    defaultBranch: string;
    language: string | null;
    htmlUrl: string | null;
    chunkCount: number;
    filesTotal: number;
    filesProcessed: number;
    isPrivate: boolean;
    indexStatus: IndexStatus;
    errorMessage: string | null;
};

export type IndexStatusresponse = {
    repositoryId: string;
    indexStatus: IndexStatus;
    filesTotal: number;
    filesProcessed: number;
    chunkCount: number;
    indexedAt: string | null;
    errorMessage: string | null;
};

export type User = {
    id: string;
    githubId: number;
    githubUsername: string;
    displayName: string;
    avatarUrl: string | null;};


export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export function getApiBaseUrl() {
    return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";
}


export function getGithubLoginUrl() {
    const backendUrl = getApiBaseUrl().replace(/\/api\/?$/, "");
    return `${backendUrl}/oauth2/authorization/github`;
}

async function parseError(res: Response): Promise<string> {
    try {
        const data = await res.json();
        return data.message ?? data.error ?? res.statusText;
    } catch {
        return res.statusText || "Request failed";
    }
}


export async function apiFetch<T>(
    path: string,
    init?: RequestInit
) : Promise<T> {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
        ...init,
        credentials: "include"
    })
    if (!res.ok) {
        throw new ApiError(res.status, await parseError(res));
    }
    if (res.status === 204) {
        return undefined as T;
    }
    return res.json() as Promise<T>;
}

export const api = {
    me: () => apiFetch<User>("/auth/me"),
    logout: () => apiFetch<void>("/auth/logout",{ method: "POST" }),

    listRepos: (refresh = true) => apiFetch<Repository[]>(`/repos?refresh=${refresh}`),
    getRepo: (id: string) => apiFetch<Repository>(`/repos/${id}`),
    startIndex: (id: string) => apiFetch<void>(`/repos/${id}/index`, {method: "POST"}),
    deleteRepo: (repoId: string) => apiFetch<void>(`/repos/${repoId}`, {method: "DELETE"}),
    indexStatus: (id: string) => apiFetch<IndexStatusresponse>(`/repos/${id}/status`),
}