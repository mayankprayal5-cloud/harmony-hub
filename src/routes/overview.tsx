import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, ExternalLink, FolderTree, ListOrdered, Loader2, MessagesSquare, Star } from "lucide-react";

import { RepoInput } from "@/components/repo-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { parseRepoUrl } from "@/lib/repo-url";
import { analyzeRepo } from "@/lib/repolens.functions";

export const Route = createFileRoute("/overview")({
  validateSearch: (search: Record<string, unknown>) => ({
    repo: typeof search["repo"] === "string" && search["repo"].trim() ? (search["repo"] as string).trim() : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Repo Overview — RepoLens" },
      {
        name: "description",
        content:
          "A plain-English overview of a public GitHub repository: what it does, its tech stack, a folder map, and the files to read first.",
      },
      { property: "og:title", content: "Repo Overview — RepoLens" },
      {
        property: "og:description",
        content: "What the project does, its tech stack, a folder map and a suggested reading order.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { repo } = Route.useSearch();
  const ref = repo ? parseRepoUrl(repo) : null;
  const analyze = useServerFn(analyzeRepo);

  const query = useQuery({
    queryKey: ["repo-analysis", ref?.owner, ref?.repo],
    enabled: Boolean(ref),
    staleTime: 30 * 60 * 1000,
    retry: false,
    queryFn: () => analyze({ data: { owner: ref!.owner, repo: ref!.repo } }),
  });

  if (!ref) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <h1 className="text-3xl font-bold">Repo Overview</h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          {repo
            ? "That link isn't a GitHub repository. Paste one below to get an overview."
            : "Paste a public GitHub repository link below to get an overview."}
        </p>
        <div className="mt-6">
          <RepoInput initialValue={repo ?? ""} />
        </div>
      </div>
    );
  }

  const slug = `${ref.owner}/${ref.repo}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Repo overview</p>
          <h1 className="mt-1 truncate font-mono text-2xl font-bold sm:text-3xl">{slug}</h1>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`https://github.com/${slug}`} target="_blank" rel="noreferrer" className="gap-1.5">
              GitHub <ExternalLink className="size-3.5" />
            </a>
          </Button>
          <Button size="sm" asChild>
            <Link to="/ask" search={{ repo: slug }} className="gap-1.5">
              <MessagesSquare className="size-3.5" /> Ask the Code
            </Link>
          </Button>
        </div>
      </div>

      {query.isPending ? <AnalyzingState slug={slug} /> : null}

      {query.isError ? (
        <div className="panel mt-8 border-destructive/40 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="min-w-0">
              <h2 className="font-semibold">We couldn't analyze that repository</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {(query.error as Error).message || "Something went wrong. Please try again."}
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => query.refetch()}>
                Try again
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {query.data ? (
        <div className="mt-8 grid gap-4">
          <section className="panel p-6">
            <h2 className="text-lg font-semibold">What this project does</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{query.data.summary}</p>
            {query.data.whoItsFor ? (
              <p className="mt-4 rounded-lg border border-border bg-secondary/50 p-4 text-sm leading-relaxed">
                <span className="font-semibold">Who it's for: </span>
                <span className="text-muted-foreground">{query.data.whoItsFor}</span>
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2 py-1">
                <Star className="size-3.5 text-primary" />
                {query.data.stars.toLocaleString()} stars
              </span>
              {query.data.language ? (
                <span className="rounded-md border border-border bg-secondary/60 px-2 py-1 font-mono">
                  {query.data.language}
                </span>
              ) : null}
              {query.data.license ? (
                <span className="rounded-md border border-border bg-secondary/60 px-2 py-1">
                  {query.data.license}
                </span>
              ) : null}
              {query.data.topics.slice(0, 5).map((topic) => (
                <span key={topic} className="rounded-md border border-border bg-secondary/60 px-2 py-1">
                  {topic}
                </span>
              ))}
            </div>
          </section>

          {query.data.techStack.length ? (
            <section className="panel p-6">
              <h2 className="text-lg font-semibold">Tech stack</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {query.data.techStack.map((item) => (
                  <div key={item.name} className="rounded-lg border border-border bg-secondary/40 p-4">
                    <p className="font-mono text-sm font-semibold text-accent-foreground">{item.name}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.role}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {query.data.folders.length ? (
            <section className="panel p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <FolderTree className="size-4 text-primary" /> Folder map
              </h2>
              <ul className="mt-4 grid gap-2">
                {query.data.folders.map((folder) => (
                  <li
                    key={folder.path}
                    className="grid gap-1 rounded-lg border border-border bg-secondary/30 p-4 transition-colors hover:border-primary/40 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:items-baseline sm:gap-4"
                  >
                    <code className="min-w-0 truncate font-mono text-sm text-accent-foreground">{folder.path}</code>
                    <span className="text-sm leading-relaxed text-muted-foreground">{folder.purpose}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {query.data.readingOrder.length ? (
            <section className="panel p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <ListOrdered className="size-4 text-primary" /> Read these files in this order
              </h2>
              <ol className="mt-4 grid gap-3">
                {query.data.readingOrder.map((item, index) => (
                  <li key={item.path} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-md border border-primary/30 bg-accent font-mono text-xs text-primary">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <a
                        href={`https://github.com/${slug}/blob/HEAD/${item.path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate font-mono text-sm text-accent-foreground underline-offset-4 hover:underline"
                      >
                        {item.path}
                      </a>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.why}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <section className="panel flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="min-w-0">
              <h2 className="text-base font-semibold">Still have questions?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Ask the code directly and get answers with sources.</p>
            </div>
            <Button asChild>
              <Link to="/ask" search={{ repo: slug }} className="gap-2">
                <MessagesSquare className="size-4" /> Ask the Code
              </Link>
            </Button>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function AnalyzingState({ slug }: { slug: string }) {
  return (
    <div className="mt-8 grid gap-4">
      <div className="panel glow-ring relative overflow-hidden p-6">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 animate-pulse bg-[var(--gradient-hero)]"
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-primary" />
          <div className="min-w-0">
            <p className="font-semibold">Reading {slug}…</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Fetching the file list and README, then writing the summary. This usually takes 10–30 seconds.
            </p>
          </div>
        </div>
      </div>
      {[0, 1, 2].map((block) => (
        <div key={block} className="panel grid gap-3 p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-8/12" />
        </div>
      ))}
    </div>
  );
}
