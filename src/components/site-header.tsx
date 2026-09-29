import { Link, useRouterState } from "@tanstack/react-router";
import { Github, Menu, ScanSearch } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/overview", label: "Repo Overview" },
  { to: "/ask", label: "Ask the Code" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const repo = useRouterState({
    select: (state) => {
      const search = state.location.search as { repo?: string };
      return typeof search?.repo === "string" ? search.repo : undefined;
    },
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/40 bg-accent text-primary">
            <ScanSearch className="size-5" />
          </span>
          <span className="truncate font-display text-lg font-bold tracking-tight">RepoLens</span>
        </Link>

        <div className="flex items-center gap-1">
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                search={link.to === "/overview" || link.to === "/ask" ? { repo } : undefined}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeOptions={{ exact: link.to === "/" }}
                activeProps={{ className: "text-foreground bg-secondary" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex">
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
              <Github className="size-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      <nav
        className={cn(
          "grid gap-1 overflow-hidden border-t border-border/70 px-4 transition-all md:hidden",
          open ? "max-h-64 py-3" : "max-h-0 py-0",
        )}
      >
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            search={link.to === "/overview" || link.to === "/ask" ? { repo } : undefined}
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeOptions={{ exact: link.to === "/" }}
            activeProps={{ className: "text-foreground bg-secondary" }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
