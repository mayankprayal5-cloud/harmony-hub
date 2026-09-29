import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  owner: z.string().min(1).max(100),
  repo: z.string().min(1).max(100),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
});

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { loadRepoContextCached, contextToPrompt, GithubError } = await import("@/lib/github.server");
        const { streamResponsesText, AiGatewayError } = await import("@/lib/ai/gateway.server");
        const { getLovableAiGatewayRunId } = await import("@/lib/ai/run-id");

        let parsed;
        try {
          parsed = bodySchema.parse(await request.json());
        } catch {
          return Response.json({ error: "That question could not be read. Please try again." }, { status: 400 });
        }

        try {
          const context = await loadRepoContextCached({ owner: parsed.owner, repo: parsed.repo });

          const textStream = await streamResponsesText(
            [
              {
                role: "system",
                content: [
                  "You answer questions about one GitHub repository for students and beginner developers.",
                  "Use only the repository information provided. If the answer is not in it, say so plainly.",
                  "Always name the files or folders your answer came from, written in backticks.",
                  "End your answer with a line starting with 'Sources:' listing those file paths, separated by commas.",
                  "Keep answers short: a few sentences or a short list. Plain English, no jargon dumps.",
                  "",
                  "REPOSITORY INFORMATION:",
                  contextToPrompt(context),
                ].join("\n"),
              },
              ...parsed.messages,
            ],
            { signal: request.signal, runId: getLovableAiGatewayRunId(request) },
          );

          return new Response(
            textStream.pipeThrough(new TextEncoderStream()),
            { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } },
          );
        } catch (error) {
          if (request.signal.aborted) return new Response(null, { status: 499 });
          if (error instanceof GithubError) return Response.json({ error: error.message }, { status: error.status });
          if (error instanceof AiGatewayError) return Response.json({ error: error.message }, { status: error.status });
          console.error(error);
          return Response.json({ error: "Something went wrong answering that question." }, { status: 500 });
        }
      },
    },
  },
});
