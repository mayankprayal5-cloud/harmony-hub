import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUp, Bot, MessagesSquare, RotateCcw, Square, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { RepoInput } from "@/components/repo-input";
import { Button } from "@/components/ui/button";
import { parseRepoUrl } from "@/lib/repo-url";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ask")({
  validateSearch: (search: Record<string, unknown>) => ({
    repo: typeof search.repo === "string" && search.repo.trim() ? search.repo.trim() : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Ask the Code — RepoLens" },
      {
        name: "description",
        content:
          "Ask questions about a public GitHub repository and get plain-English answers that name the files they came from.",
      },
      { property: "og:title", content: "Ask the Code — RepoLens" },
      {
        property: "og:description",
        content: "Chat with any public GitHub repository and get answers with file references.",
      },
    ],
  }),
  component: Ask,
});

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Where does the app start?",
  "How is the project structured?",
  "How do I run this locally?",
  "What are the main dependencies and why?",
];

function Ask() {
  const { repo } = Route.useSearch();
  const ref = useMemo(() => (repo ? parseRepoUrl(repo) : null), [repo]);

  if (!ref) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <h1 className="text-3xl font-bold">Ask the Code</h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          {repo
            ? "That link isn't a GitHub repository. Paste one below to start asking questions."
            : "Pick a repository first, then ask it anything."}
        </p>
        <div className="mt-6">
          <RepoInput initialValue={repo ?? ""} />
        </div>
      </div>
    );
  }

  return <ChatPanel key={`${ref.owner}/${ref.repo}`} owner={ref.owner} repo={ref.repo} />;
}

function ChatPanel({ owner, repo }: { owner: string; repo: string }) {
  const slug = `${owner}/${repo}`;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streaming]);

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || streaming) return;

    const history = [...messages, { role: "user" as const, content: trimmed }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setError(null);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ owner, repo, messages: history }),
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Something went wrong answering that question.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: answer }]);
      }
      if (!answer.trim()) throw new Error("The answer came back empty. Please try asking again.");
    } catch (caught) {
      if (controller.signal.aborted) {
        setMessages((current) => current.filter((message) => message.content.trim().length > 0));
      } else {
        setError(caught instanceof Error ? caught.message : "Something went wrong.");
        setMessages(history);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col px-4 py-10 sm:px-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Ask the code</p>
          <h1 className="mt-1 truncate font-mono text-2xl font-bold sm:text-3xl">{slug}</h1>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {messages.length ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                abortRef.current?.abort();
                setMessages([]);
                setError(null);
                inputRef.current?.focus();
              }}
            >
              <RotateCcw className="size-3.5" /> New conversation
            </Button>
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <Link to="/overview" search={{ repo: slug }}>
              Overview
            </Link>
          </Button>
        </div>
      </div>

      <div className="panel mt-6 flex min-h-[26rem] flex-col">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="grid place-items-center py-10 text-center">
              <span className="grid size-12 place-items-center rounded-xl border border-primary/30 bg-accent text-primary">
                <MessagesSquare className="size-6" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">Ask anything about this repo</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                Answers are based on the repository's files and will tell you which ones they came from.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-lg border border-border bg-secondary/60 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-5">
              {messages.map((message, index) => (
                <Bubble
                  key={index}
                  message={message}
                  pending={streaming && index === messages.length - 1 && !message.content}
                />
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {error ? (
          <p role="alert" className="mx-4 mb-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:mx-6">
            {error}
          </p>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 border-t border-border p-3 sm:p-4"
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send(input);
              }
            }}
            placeholder={`Ask about ${slug}…`}
            aria-label="Your question"
            className="max-h-40 min-h-11 w-full min-w-0 resize-y rounded-lg border border-input bg-secondary/40 px-3 py-2.5 text-sm leading-relaxed transition-colors placeholder:text-muted-foreground/70 focus:border-primary/60 focus:outline-none"
          />
          {streaming ? (
            <Button type="button" variant="outline" size="icon" onClick={() => abortRef.current?.abort()} aria-label="Stop">
              <Square className="size-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send question">
              <ArrowUp className="size-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}

function Bubble({ message, pending }: { message: ChatMessage; pending: boolean }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("grid grid-cols-[auto_minmax(0,1fr)] gap-3", isUser && "sm:grid-cols-[auto_minmax(0,1fr)]")}>
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg border",
          isUser ? "border-border bg-secondary text-muted-foreground" : "border-primary/30 bg-accent text-primary",
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </span>
      <div className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {isUser ? "You" : "RepoLens"}
        </p>
        {pending ? (
          <span className="mt-2 flex gap-1" aria-label="Thinking">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="size-2 animate-bounce rounded-full bg-primary/70"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </span>
        ) : (
          <div
            className={cn(
              "mt-1.5 whitespace-pre-wrap text-sm leading-relaxed",
              isUser ? "rounded-lg bg-secondary px-3 py-2 text-foreground" : "text-muted-foreground",
            )}
          >
            {renderInlineCode(message.content)}
          </div>
        )}
      </div>
    </div>
  );
}

/** Renders `backticked` spans as monospace chips. */
function renderInlineCode(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, index) =>
    part.startsWith("`") && part.endsWith("`") && part.length > 2 ? (
      <code key={index} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-accent-foreground">
        {part.slice(1, -1)}
      </code>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}
