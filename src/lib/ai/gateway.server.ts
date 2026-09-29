import { createLovableAiGatewayRunIdFetch } from "./run-id";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";

export const CHAT_MODEL = "openai/gpt-6-astra";

export type ResponsesMessage = { role: "system" | "user" | "assistant"; content: string };

export class AiGatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AiGatewayError";
  }
}

function friendlyMessage(status: number, raw: string) {
  if (status === 402) return "The AI workspace is out of credits. Add credits to keep using RepoLens.";
  if (status === 429) return "Too many requests right now. Please wait a moment and try again.";
  if (status === 401) return "The AI service is not configured correctly.";
  if (status === 403) return raw || "The AI service refused this request.";
  return raw || `The AI service returned an error (${status}).`;
}

/**
 * Calls the Lovable AI Gateway Responses API and returns a stream of text deltas.
 */
export async function streamResponsesText(
  input: ResponsesMessage[],
  opts: { signal?: AbortSignal; runId?: string; effort?: "low" | "medium" | "high" } = {},
): Promise<ReadableStream<string>> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiGatewayError(401, "The AI service is not configured correctly.");

  const gateway = createLovableAiGatewayRunIdFetch(opts.runId);
  const response = await gateway.fetch(GATEWAY_URL, {
    method: "POST",
    ...(opts.signal ? { signal: opts.signal } : {}),
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      input,
      stream: true,
      store: false,
      reasoning: { effort: opts.effort ?? "medium", summary: "auto" },
      include: ["reasoning.encrypted_content"],
    }),
  });

  if (!response.ok || !response.body) {
    let raw = "";
    try {
      raw = await response.text();
      const parsed = JSON.parse(raw) as { error?: { message?: string }; message?: string };
      raw = parsed.error?.message ?? parsed.message ?? raw;
    } catch {
      /* keep raw text */
    }
    throw new AiGatewayError(response.status, friendlyMessage(response.status, raw));
  }

  const decoder = new TextDecoder();
  let buffer = "";

  return response.body.pipeThrough(
    new TransformStream<Uint8Array, string>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const event of events) {
          for (const line of event.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data) as {
                type?: string;
                delta?: string;
                response?: { error?: { message?: string } };
                message?: string;
              };
              if (parsed.type === "response.output_text.delta" && typeof parsed.delta === "string") {
                controller.enqueue(parsed.delta);
              } else if (parsed.type === "error" || parsed.type === "response.failed") {
                controller.error(
                  new AiGatewayError(502, parsed.response?.error?.message ?? parsed.message ?? "The AI service failed mid-answer."),
                );
              }
            } catch {
              /* ignore keep-alive / partial frames */
            }
          }
        }
      },
    }),
  );
}

export async function collectResponsesText(
  input: ResponsesMessage[],
  opts: { signal?: AbortSignal; effort?: "low" | "medium" | "high" } = {},
): Promise<string> {
  const stream = await streamResponsesText(input, opts);
  const reader = stream.getReader();
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += value;
  }
  if (!text.trim()) throw new AiGatewayError(502, "The AI service returned an empty answer. Please try again.");
  return text;
}

/** Extracts the first JSON object from a model response that may include prose or fences. */
export function extractJson<T>(text: string): T {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const candidate = (fenced ? fenced[1] : text) ?? "";
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new AiGatewayError(502, "The AI response could not be read. Please try again.");
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}
