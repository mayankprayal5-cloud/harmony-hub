import { createFileRoute, Link } from "@tanstack/react-router";

import { RepoInput } from "@/components/repo-input";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About RepoLens — how the repo explainer works" },
      {
        name: "description",
        content:
          "RepoLens reads a public GitHub repository through the GitHub API and uses AI to explain it in plain English. Here's what it does and what it doesn't.",
      },
      { property: "og:title", content: "About RepoLens" },
      {
        property: "og:description",
        content: "How RepoLens reads public GitHub repositories and explains them in plain English.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold sm:text-4xl">About RepoLens</h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        RepoLens is a reading companion for unfamiliar codebases. You paste a public GitHub repository link, and it gives
        you the overview a teammate would give you on your first day: what the project is for, what it's built with,
        what lives in each folder, and which files to read first.
      </p>

      <div className="mt-10 grid gap-4">
        <section className="panel p-6">
          <h2 className="text-lg font-semibold">How it works</h2>
          <ol className="mt-4 grid gap-4 text-sm leading-relaxed text-muted-foreground">
            <li>
              <span className="font-mono text-primary">01</span> RepoLens checks that your link points at a real GitHub
              repository.
            </li>
            <li>
              <span className="font-mono text-primary">02</span> It reads the repository through the public GitHub API —
              the file list, the README, and package files like{" "}
              <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">package.json</code>.
            </li>
            <li>
              <span className="font-mono text-primary">03</span> That information goes to an AI model, which writes the
              summary, tech stack, folder map and reading order.
            </li>
            <li>
              <span className="font-mono text-primary">04</span> In <strong>Ask the Code</strong>, your questions go to
              the same model with the same repository context, and answers point back at the files they came from.
            </li>
          </ol>
        </section>

        <section className="panel p-6">
          <h2 className="text-lg font-semibold">What it doesn't do</h2>
          <ul className="mt-4 grid gap-2 text-sm leading-relaxed text-muted-foreground">
            <li>No accounts, no login, no saved history — nothing you paste is stored.</li>
            <li>Private repositories aren't supported; RepoLens only reads public ones.</li>
            <li>
              It reads the structure and key files rather than every line, so treat answers as a guide and confirm
              details in the code itself.
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold">Try it on a repo</h2>
        <div className="mt-4">
          <RepoInput size="sm" />
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Or head back{" "}
          <Link to="/" className="text-primary underline-offset-4 transition-colors hover:underline">
            home
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
