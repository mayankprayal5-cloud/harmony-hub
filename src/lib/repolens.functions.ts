import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({ owner: z.string().min(1), repo: z.string().min(1) });

export type RepoAnalysis = {
  fullName: string;
  htmlUrl: string;
  language: string | null;
  stars: number;
  topics: string[];
  license: string | null;
  summary: string;
  whoItsFor: string;
  techStack: { name: string; role: string }[];
  folders: { path: string; purpose: string }[];
  readingOrder: { path: string; why: string }[];
};

export const analyzeRepo = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<RepoAnalysis> => {
    const { loadRepoContext, contextToPrompt } = await import("./github.server");
    const { collectResponsesText, extractJson } = await import("./ai/gateway.server");

    const context = await loadRepoContext(data);

    const raw = await collectResponsesText([
      {
        role: "system",
        content: [
          "You explain GitHub repositories to students and beginner developers.",
          "Write in plain English. Avoid jargon; when you must use a technical term, explain it in the same sentence.",
          "Base every statement on the provided file list, manifests and README. Never invent files.",
          "Reply with a single JSON object only, no prose and no code fences, using exactly these keys:",
          '{"summary": string, "whoItsFor": string, "techStack": [{"name": string, "role": string}], "folders": [{"path": string, "purpose": string}], "readingOrder": [{"path": string, "why": string}]}',
          "summary: 3-5 sentences on what the project does and the problem it solves.",
          "whoItsFor: 1-2 sentences.",
          "techStack: up to 8 entries, role is one short sentence.",
          "folders: up to 8 real top-level folders or key files, purpose is one short sentence.",
          "readingOrder: 4-6 real file paths in the order a newcomer should read them, why is one short sentence.",
        ].join("\n"),
      },
      { role: "user", content: contextToPrompt(context) },
    ]);

    const parsed = extractJson<Omit<RepoAnalysis, "fullName" | "htmlUrl" | "language" | "stars" | "topics" | "license">>(raw);

    return {
      fullName: context.meta.fullName,
      htmlUrl: context.meta.htmlUrl,
      language: context.meta.language,
      stars: context.meta.stars,
      topics: context.meta.topics,
      license: context.meta.license,
      summary: parsed.summary ?? "",
      whoItsFor: parsed.whoItsFor ?? "",
      techStack: Array.isArray(parsed.techStack) ? parsed.techStack.slice(0, 8) : [],
      folders: Array.isArray(parsed.folders) ? parsed.folders.slice(0, 8) : [],
      readingOrder: Array.isArray(parsed.readingOrder) ? parsed.readingOrder.slice(0, 6) : [],
    };
  });
