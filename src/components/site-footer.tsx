import { Link } from "@tanstack/react-router";
import { ScanSearch } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/70">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-primary/40 bg-accent text-primary">
              <ScanSearch className="size-4" />
            </span>
            <span className="font-display text-base font-bold">RepoLens</span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Paste a public GitHub repository link and get a plain-English tour of the codebase — then ask it anything.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Product</h3>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <li>
              <Link to="/" className="transition-colors hover:text-foreground">
                Home
              </Link>
            </li>
            <li>
              <Link to="/overview" search={{ repo: undefined }} className="transition-colors hover:text-foreground">
                Repo Overview
              </Link>
            </li>
            <li>
              <Link to="/ask" search={{ repo: undefined }} className="transition-colors hover:text-foreground">
                Ask the Code
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">More</h3>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="transition-colors hover:text-foreground">
                About
              </Link>
            </li>
            <li>
              <a
                href="https://docs.github.com/en/rest"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                GitHub API
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">
        RepoLens reads public repositories only. Nothing you paste is saved.
      </div>
    </footer>
  );
}
