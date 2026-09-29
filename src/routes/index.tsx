import { createFileRoute, Link } from "@tanstack/react-router";
import { FileSearch, FolderTree, ListOrdered, MessagesSquare, ShieldCheck, Sparkles } from "lucide-react";

import { RepoInput } from "@/components/repo-input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RepoLens — Understand any GitHub repo in seconds" },
      {
        name: "description",
        content:
          "Paste a public GitHub repository link and RepoLens explains the project in plain English, maps its folders, and answers your questions about the code.",
      },
      { property: "og:title", content: "RepoLens — Understand any GitHub repo in seconds" },
      {
        property: "og:description",
        content: "Plain-English summaries, folder maps and a chat about any public GitHub repository.",
      },
    ],
  }),
  component: Home,
});

const features = [
  {
    icon: FileSearch,
    title: "Plain-English summary",
    body: "What the project does and the problem it solves, written for someone seeing it for the first time.",
  },
  {
    icon: FolderTree,
    title: "Folder map",
    body: "Every main folder explained in one line, so you know where to look before you open anything.",
  },
  {
    icon: ListOrdered,
    title: "Reading order",
    body: "A short list of files to read in order, so you learn the codebase in the right sequence.",
  },
  {
    icon: MessagesSquare,
    title: "Ask the code",
    body: "Ask questions in a chat and get answers that name the files they came from.",
  },
  {
    icon: Sparkles,
    title: "Works on any public repo",
    body: "Files are read live through the public GitHub API — no setup, no cloning, no install.",
  },
  {
    icon: ShieldCheck,
    title: "Nothing is stored",
    body: "No account and no saved history. Close the tab and the analysis is gone.",
  },
];

const steps = [
  { step: "01", title: "Paste the link", body: "Drop in any public GitHub repository URL." },
  { step: "02", title: "Get the summary", body: "See what it does, its tech stack, folders and a reading order." },
  { step: "03", title: "Ask questions", body: "Chat about the code and get answers with file references." },
];

function Home() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="grid-backdrop pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-accent px-3 py-1 font-mono text-xs text-accent-foreground">
            <Sparkles className="size-3.5" />
            AI codebase explainer
          </span>
          <h1 className="mt-6 text-balance text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
            Understand any GitHub repo <span className="text-gradient">in seconds</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Paste a public repository link. RepoLens reads the project and explains it in plain English — what it does,
            how it's organised, and which files to read first.
          </p>

          <div className="mx-auto mt-9 max-w-2xl text-left">
            <RepoInput />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold sm:text-3xl">What you get</h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Built for students and beginner developers landing in an unfamiliar codebase.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="panel lift p-5">
              <span className="grid size-10 place-items-center rounded-lg border border-primary/30 bg-accent text-primary">
                <feature.icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h2 className="text-2xl font-bold sm:text-3xl">How it works</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((item) => (
            <article key={item.step} className="panel lift relative p-6">
              <span className="font-mono text-sm text-primary">{item.step}</span>
              <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          Curious how it works under the hood?{" "}
          <Link to="/about" className="text-primary underline-offset-4 transition-colors hover:underline">
            Read about RepoLens
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
