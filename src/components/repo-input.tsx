import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Github } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { parseRepoUrl, repoSlug } from "@/lib/repo-url";
import { cn } from "@/lib/utils";

const EXAMPLES = ["facebook/react", "vercel/next.js", "tailwindlabs/tailwindcss"];

export function RepoInput({ initialValue = "", size = "lg" }: { initialValue?: string; size?: "lg" | "sm" }) {
  const navigate = useNavigate();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  function submit(raw: string) {
    const ref = parseRepoUrl(raw);
    if (!ref) {
      setError("That doesn't look like a GitHub repository link. Try something like https://github.com/facebook/react");
      return;
    }
    setError(null);
    navigate({ to: "/overview", search: { repo: repoSlug(ref) } });
  }

  return (
    <div className="w-full">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(value);
        }}
        className={cn(
          "panel glow-ring grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 p-2 transition-shadow focus-within:shadow-[0_0_0_1px_var(--primary)]",
          size === "lg" ? "sm:p-2.5" : "",
        )}
      >
        <div className="flex min-w-0 items-center gap-2 pl-2">
          <Github className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              if (error) setError(null);
            }}
            placeholder="https://github.com/owner/repository"
            aria-label="GitHub repository URL"
            className={cn(
              "w-full min-w-0 bg-transparent font-mono text-foreground placeholder:text-muted-foreground/70 focus:outline-none",
              size === "lg" ? "py-2.5 text-sm sm:text-base" : "py-2 text-sm",
            )}
          />
        </div>
        <Button type="submit" size={size === "lg" ? "lg" : "default"} className="shrink-0 gap-2">
          Analyze
          <ArrowRight className="size-4" />
        </Button>
      </form>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Try:</span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setValue(example);
                submit(example);
              }}
              className="rounded-md border border-border bg-secondary/60 px-2 py-1 font-mono transition-colors hover:border-primary/50 hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
