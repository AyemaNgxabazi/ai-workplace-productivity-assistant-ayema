import { createFileRoute } from "@tanstack/react-router";
import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Send, MessagesSquare, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
});

type Thread = { id: string; title: string; messages: UIMessage[] };
const STORAGE_KEY = "pulse_chat_threads_v1";

function loadThreads(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is Thread =>
        t && typeof t.id === "string" && Array.isArray(t.messages),
    );
  } catch {
    return [];
  }
}

function saveThreads(threads: Thread[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {
    /* quota or disabled storage — ignore */
  }
}

class ChatErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  reset = () => {
    this.setState({ error: null });
    this.props.onReset();
  };
  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400" />
          <div>
            <h2 className="text-base font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error.message || "The chat hit an unexpected error."}
            </p>
          </div>
          <Button onClick={this.reset} size="sm">
            Start a new chat
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ChatPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const t = loadThreads();
    if (t.length) {
      setThreads(t);
      setThreadId(t[0].id);
    } else {
      const def: Thread = {
        id: crypto.randomUUID(),
        title: "New conversation",
        messages: [],
      };
      setThreads([def]);
      setThreadId(def.id);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveThreads(threads);
  }, [threads, hydrated]);

  const current = threads.find((t) => t.id === threadId);

  const newThread = () => {
    const t: Thread = {
      id: crypto.randomUUID(),
      title: "New conversation",
      messages: [],
    };
    setThreads((prev) => [t, ...prev]);
    setThreadId(t.id);
  };

  const removeThread = (id: string) => {
    setThreads((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (threadId === id) setThreadId(next[0]?.id ?? null);
      return next;
    });
  };

  const updateThread = (id: string, messages: UIMessage[]) => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const safeMessages = Array.isArray(messages) ? messages : [];
        const firstUser = safeMessages.find((m) => m.role === "user");
        const firstText =
          firstUser?.parts?.find((p: any) => p?.type === "text") as
            | { text?: string }
            | undefined;
        const title =
          t.title === "New conversation" && firstText?.text
            ? firstText.text.slice(0, 60)
            : t.title;
        return { ...t, title, messages: safeMessages };
      }),
    );
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/30 md:flex">
        <div className="p-3">
          <Button onClick={newThread} className="w-full gap-2">
            <Plus className="h-4 w-4" /> New chat
          </Button>
        </div>
        <ScrollArea className="flex-1 px-2 pb-2">
          {threads.length === 0 && (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground">
              No conversations yet
            </div>
          )}
          <div className="space-y-1">
            {threads.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "group flex items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                  threadId === t.id && "bg-accent",
                )}
              >
                <button
                  className="flex-1 truncate text-left"
                  onClick={() => setThreadId(t.id)}
                >
                  {t.title}
                </button>
                <button
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => removeThread(t.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      <div className="flex flex-1 flex-col">
        {current ? (
          <ChatErrorBoundary key={current.id} onReset={newThread}>
            <ChatThread
              threadId={current.id}
              initialMessages={current.messages ?? []}
              onChange={(msgs) => updateThread(current.id, msgs)}
            />
          </ChatErrorBoundary>
        ) : (
          <EmptyState onNew={newThread} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[var(--primary-glow)] text-primary-foreground shadow-[var(--shadow-glow)]">
        <MessagesSquare className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">AI Chatbot</h2>
        <p className="text-sm text-muted-foreground">
          Start a new conversation to chat with your AI co-pilot.
        </p>
      </div>
      <Button onClick={onNew} className="gap-2">
        <Plus className="h-4 w-4" /> New conversation
      </Button>
    </div>
  );
}

function ChatThread({
  threadId,
  initialMessages,
  onChange,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  onChange: (m: UIMessage[]) => void;
}) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: (Array.isArray(initialMessages) ? initialMessages : []) as any,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    onChange(messages as UIMessage[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  const isPending = status === "submitted" || status === "streaming";

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 p-6">
          {messages.length === 0 && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
              Say hi — ask WorkSmart to draft, plan, summarize, or research anything.
            </div>
          )}
          {messages.map((m) => {
            const text = m.parts
              .filter((p: any) => p.type === "text")
              .map((p: any) => p.text)
              .join("");
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                <Card
                  className={cn(
                    "max-w-[85%] p-3 text-sm",
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-card/70",
                  )}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{text}</p>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:mt-3 prose-headings:mb-1">
                      <ReactMarkdown>{text || "…"}</ReactMarkdown>
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
          {isPending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-border bg-background/70 backdrop-blur-md">
        <form onSubmit={submit} className="mx-auto flex max-w-3xl gap-2 p-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(e as any);
              }
            }}
            placeholder="Message WorkSmart… (Shift+Enter for new line)"
            className="min-h-[52px] flex-1 resize-none bg-card/40"
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending || !input.trim()} className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </form>
        <div className="mx-auto flex max-w-3xl items-center gap-1 px-4 pb-3 text-[11px] text-muted-foreground">
          <AlertTriangle className="h-3 w-3 text-amber-400" />
          AI may produce inaccurate information. Verify before acting on it.
        </div>
      </div>
    </>
  );
}