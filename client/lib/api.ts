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

function normalizeRepository(repo: Repository & { private?: boolean }): Repository {
    return {
        ...repo,
        isPrivate: repo.isPrivate === true || repo.private === true,
    };
}

export type IndexStatusResponse = {
    repositoryId: string;
    indexStatus: IndexStatus;
    filesTotal: number;
    filesProcessed: number;
    chunkCount: number;
    indexedAt: string | null;
    errorMessage: string | null;
};
export type IndexStatusresponse = IndexStatusResponse;

export type User = {
    id: string;
    githubId: number;
    githubUsername: string;
    displayName: string;
    avatarUrl: string | null;
};

export type GithubRepoSummary = {
    name: string;
    fullName: string;
    description: string;
    language: string | null;
    stargazersCount: number | null;
    forksCount: number | null;
    openIssuesCount: number | null;
    htmlUrl: string;
    updatedAt: string;
    isPrivate: boolean | null;
};

export type GithubProfile = {
    login: string;
    id: number | null;
    name: string | null;
    bio: string | null;
    company: string | null;
    location: string | null;
    blog: string | null;
    email: string | null;
    twitterUsername: string | null;
    publicRepos: number | null;
    followers: number | null;
    following: number | null;
    publicGists: number | null;
    createdAt: string | null;
    updatedAt: string | null;
    avatarUrl: string | null;
    htmlUrl: string | null;
    recentRepos: GithubRepoSummary[];
};

export type ChatSession = {
    id: string;
    repositoryId: string;
    repositoryName: string;
    title: string;
    createdAt: string;
};

export type Citation = {
    filePath: string;
    startLine: number | null;
    endLine: number | null;
    language: string | null;
    excerpt?: string | null;
};

export type ChatMessage = {
    id: string;
    role: "USER" | "ASSISTANT";
    content: string;
    citations: Citation[];
    createdAt: string;
};


export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export function getApiBaseUrl() {
    return (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api").replace(/\/+$/, "");
}


export function getGithubLoginUrl() {
    const backendUrl = getApiBaseUrl().replace(/\/api\/?$/, "");
    return `${backendUrl}/oauth2/authorization/github`;
}

async function parseError(res: Response): Promise<string> {
    try {
        const text = await res.text();
        if (!text.trim()) return `${res.status} ${res.statusText || "Request failed"}`;
        try {
            const data = JSON.parse(text) as {
                message?: string;
                error?: string;
            };
            return data.message ?? data.error ?? text;
        } catch {
            return text;
        }
    } catch {
        return `${res.status} ${res.statusText || "Request failed"}`;
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
    profile: () => apiFetch<User>("/profile"),
    githubProfile: () => apiFetch<GithubProfile>("/profile/github"),
    logout: () => apiFetch<void>("/auth/logout",{ method: "POST" }),

    listRepos: async (refresh = true) => {
        const repos = await apiFetch<(Repository & { private?: boolean })[]>(`/repos?refresh=${refresh}`);
        return repos.map(normalizeRepository);
    },
    importRepo: async (url: string) => {
        const repo = await apiFetch<Repository & { private?: boolean }>("/repos/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
        });
        return normalizeRepository(repo);
    },
    getRepo: async (id: string) =>
        normalizeRepository(await apiFetch<Repository & { private?: boolean }>(`/repos/${id}`)),
    startIndex: async (id: string) =>
        normalizeRepository(await apiFetch<Repository & { private?: boolean }>(`/repos/${id}/index`, {
            method: "POST",
            headers: { Accept: "application/json" },
        })),
    deleteRepo: (repoId: string) => apiFetch<void>(`/repos/${repoId}`, {method: "DELETE"}),
    indexStatus: (id: string) => apiFetch<IndexStatusresponse>(`/repos/${id}/status`),
    createSession: (repositoryId: string, title?: string) =>
        apiFetch<ChatSession>("/chats/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ repositoryId, title }),
        }),
    listSessions: (repositoryId: string) =>
        apiFetch<ChatSession[]>(
            `/chats/sessions?repositoryId=${encodeURIComponent(repositoryId)}`),
    listAllSessions: () => apiFetch<ChatSession[]>("/chats/sessions/all"),

    getMessages: (sessionId: string) =>
        apiFetch<ChatMessage[]>(`/chats/sessions/${sessionId}`),
    renameSession: (sessionId: string, title: string) =>
        apiFetch<ChatSession>(`/chats/sessions/${sessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
        }),
    deleteSession: (sessionId: string) =>
        apiFetch<void>(`/chats/sessions/${sessionId}`, { method: "DELETE" }),
};