"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatErrorState } from "@/components/chat/chat-error-state";
import { ChatHeader } from "@/components/chat/chat-header";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { IndexingState } from "@/components/chat/indexing-state";
import { AppShell } from "@/components/layout/app-shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  lastSessionStorageKey,
  useAllChatSessions,
  useChatMessages,
  useChatSessions,
  useCreateChatSession,
  useDeleteChatSession,
  useRenameChatSession,
  useStreamChat,
} from "@/hooks/use-chat";
import { useIndexStatus, useRepository } from "@/hooks/use-repo";
import type { ChatSession } from "@/lib/api";

export function ChatView({ repoId }: { repoId: string }) {
  const repoQuery = useRepository(repoId);
  const router = useRouter();
  const searchParams = useSearchParams();
  const indexStatus = repoQuery.data?.indexStatus;
  const isIndexing = indexStatus === "PENDING" || indexStatus === "INDEXING";
  const statusQuery = useIndexStatus(repoId, isIndexing);
  const currentStatus = statusQuery.data?.indexStatus ?? indexStatus;
  const ready = currentStatus === "READY";
  const sessionsQuery = useChatSessions(repoId, ready);
  const allSessionsQuery = useAllChatSessions(true);
  const createSession = useCreateChatSession(repoId);
  const renameSession = useRenameChatSession(repoId);
  const deleteSession = useDeleteChatSession(repoId);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionIntent, setSessionIntent] = useState<"restore" | "chosen">("restore");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [conversationsOpen, setConversationsOpen] = useState(true);
  const [renameTarget, setRenameTarget] = useState<ChatSession | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null);
  const sessions = useMemo(() => {
    const merged = new Map<string, ChatSession>();
    for (const session of sessionsQuery.data ?? []) {
      merged.set(session.id, session);
    }
    for (const session of allSessionsQuery.data ?? []) {
      merged.set(session.id, session);
    }
    return [...merged.values()].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
  }, [allSessionsQuery.data, sessionsQuery.data]);
  const historyLoading = allSessionsQuery.isLoading && sessionsQuery.isLoading;
  const historyError = allSessionsQuery.isError && sessionsQuery.isError;
  const sessionId = selectedSessionId;
  const messagesQuery = useChatMessages(sessionId);
  const { send, resubmit, regenerate, stop, streaming, streamText, streamThinking, streamStatus } =
    useStreamChat(sessionId, repoId);

  useEffect(() => {
    stop();
      // Defer state updates to avoid synchronous setState in effect
      setTimeout(() => {
        setSelectedSessionId(null);
        setSessionIntent("restore");
      }, 0);
    }, [repoId, stop]);

  useEffect(() => {
    if (!ready || !sessionsQuery.isSuccess || sessionIntent !== "restore") return;
    const fromUrl = searchParams.get("session");
    const stored = window.localStorage.getItem(lastSessionStorageKey(repoId));
    const match =
      sessions.find((session) => session.id === fromUrl) ??
      sessions.find((session) => session.id === stored) ??
      null;
      // Defer state updates to avoid synchronous setState in effect
      setTimeout(() => {
        setSelectedSessionId(match?.id ?? null);
        setSessionIntent("chosen");
      }, 0);
    }, [ready, repoId, searchParams, sessionIntent, sessions, sessionsQuery.isSuccess]);

  useEffect(() => {
    if (!sessionId) return;
    window.localStorage.setItem(lastSessionStorageKey(repoId), sessionId);
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("session") === sessionId) return;
    params.set("session", sessionId);
    router.replace(`/chat/${repoId}?${params.toString()}`, { scroll: false });
  }, [repoId, router, searchParams, sessionId]);

  const selectSession = useCallback(
    (id: string | null) => {
      stop();
      setSessionIntent("chosen");
      setSelectedSessionId(id);
      setMobileOpen(false);
      if (!id) {
        window.localStorage.removeItem(lastSessionStorageKey(repoId));
        const params = new URLSearchParams(searchParams.toString());
        params.delete("session");
        const query = params.toString();
        router.replace(query ? `/chat/${repoId}?${query}` : `/chat/${repoId}`, { scroll: false });
      }
    },
    [repoId, router, searchParams, stop],
  );

  const handleSend = async (content: string) => {
    setConversationsOpen(false);
    setMobileOpen(false);
    let id = sessionId;
    if (!id) {
      const session = await createSession.mutateAsync(undefined);
      selectSession(session.id);
      id = session.id;
    }
    await send(content, id);
  };

  const repo = useMemo(() => {
    if (!repoQuery.data) return null;
    return {
      ...repoQuery.data,
      indexStatus: currentStatus ?? repoQuery.data.indexStatus,
      filesProcessed: statusQuery.data?.filesProcessed ?? repoQuery.data.filesProcessed,
      filesTotal: statusQuery.data?.filesTotal ?? repoQuery.data.filesTotal,
      chunkCount: statusQuery.data?.chunkCount ?? repoQuery.data.chunkCount,
      errorMessage: statusQuery.data?.errorMessage ?? repoQuery.data.errorMessage,
    };
  }, [currentStatus, repoQuery.data, statusQuery.data]);

  if (repoQuery.isLoading) {
    return (
      <AppShell title="Loading chat..." contentClassName="p-0">
        <div className="grid flex-1 gap-px md:grid-cols-[16rem_1fr]">
          <Skeleton className="hidden h-full md:block" />
          <Skeleton className="h-full w-full" />
        </div>
      </AppShell>
    );
  }

  if (repoQuery.isError || !repo) {
    return <ChatErrorState error={repoQuery.error} />;
  }

  const sidebar = (
    <ChatSidebar
      sessions={sessions}
      sessionsLoading={historyLoading}
      sessionsError={historyError}
      onRetry={() => {
        void allSessionsQuery.refetch();
        void sessionsQuery.refetch();
      }}
      sessionId={sessionId}
      onSelectSession={(id) => {
        const session = sessions.find((item) => item.id === id);
        if (session && session.repositoryId !== repoId) {
          router.push(`/chat/${session.repositoryId}?session=${session.id}`);
          return;
        }
        selectSession(id);
      }}
      onCreateSession={() => selectSession(null)}
      onRenameSession={(session) => {
        setRenameTarget(session);
        setRenameValue(session.title);
      }}
      onDeleteSession={setDeleteTarget}
    />
  );

  return (
    <AppShell
      className="h-svh min-h-0 overflow-hidden"
      title={repo.fullName}
      description={ready ? "Repository-aware coding assistant" : "Waiting for indexing to finish"}
      contentClassName="min-h-0 p-0"
      actions={
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/dashboard" />}
        >
          <ArrowLeft data-icon="inline-start" />
          Repos
        </Button>
      }
    >
      <div className="flex h-full min-h-0 flex-1 overflow-hidden">
        {conversationsOpen && (
        <aside className="hidden h-full min-h-0 w-64 shrink-0 border-r bg-muted/20 md:flex md:flex-col">
          {sidebar}
        </aside>
        )}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ChatHeader
            repo={repo}
            onOpenConversations={() => setMobileOpen(true)}
            conversationsOpen={conversationsOpen}
            onToggleConversations={() => setConversationsOpen((open) => !open)}
          />
          {!ready ? (
            <IndexingState repo={repo} status={statusQuery.data} />
          ) : (
            <>
              <ChatMessages
                repo={repo}
                messages={messagesQuery.data ?? []}
                streamText={streamText}
                              streamThinking={streamThinking}
                              streamStatus={streamStatus}
                              isLoading={Boolean(sessionId) && messagesQuery.isLoading}
                              error={messagesQuery.isError ? messagesQuery.error : null}
                              onRetry={() => void messagesQuery.refetch()}
                              disabled={streaming}
                              onSuggestion={handleSend}
                              onResubmit={async (message, content) => {
                                if (sessionId && !message.id.startsWith("pending-")) {
                                  await resubmit(message.id, content, sessionId);
                                }
                              }}
                              onRegenerate={() => {
                                if (sessionId) void regenerate(sessionId);
                              }}
                            />
              <ChatComposer
                disabled={!ready}
                streaming={streaming}
                onSend={handleSend}
                onStop={stop}
              />
            </>
          )}
        </section>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Conversations</SheetTitle>
            <SheetDescription>Switch, rename, or delete chats for this repository.</SheetDescription>
          </SheetHeader>
          {sidebar}
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!renameTarget || !renameValue.trim()) return;
              renameSession.mutate({
                sessionId: renameTarget.id,
                title: renameValue.trim(),
              });
              setRenameTarget(null);
            }}
          >
            <DialogHeader>
              <DialogTitle>Rename conversation</DialogTitle>
              <DialogDescription>This name is only visible in your account.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-2">
              <Label htmlFor="chat-title">Title</Label>
              <Input
                id="chat-title"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                maxLength={200}
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setRenameTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!renameValue.trim() || renameSession.isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.title}" will be removed permanently.`
                : "This conversation will be removed permanently."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteSession.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                const id = deleteTarget.id;
                deleteSession.mutate(id, {
                  onSuccess: () => {
                    if (id === sessionId) selectSession(null);
                    setDeleteTarget(null);
                  },
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
