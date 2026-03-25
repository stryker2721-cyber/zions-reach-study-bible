/**
 * Grok API Service for streaming Bible study responses
 * Uses xAI's Grok API with streaming support
 */

interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GrokStreamEvent {
  type: "start" | "content" | "stop" | "error";
  content?: string;
  error?: string;
}

/**
 * Stream a response from Grok API
 * Yields content chunks as they arrive
 */
export async function* streamGrokResponse(
  messages: GrokMessage[],
  context?: string
): AsyncGenerator<GrokStreamEvent, void, unknown> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) {
    yield { type: "error", error: "Grok API key not configured" };
    return;
  }

  try {
    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context);

    // Prepare messages with system prompt
    const allMessages: GrokMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    yield { type: "start" };

    // Call Grok API with streaming
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4-latest",
        messages: allMessages,
        stream: true,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      yield {
        type: "error",
        error: `Grok API error: ${errorData.error || response.statusText}`,
      };
      return;
    }

    if (!response.body) {
      yield { type: "error", error: "No response body from Grok API" };
      return;
    }

    // Process streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);

            if (data === "[DONE]") {
              yield { type: "stop" };
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content =
                parsed.choices?.[0]?.delta?.content || "";

              if (content) {
                yield { type: "content", content };
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.startsWith("data: ")) {
        const data = buffer.slice(6);
        if (data !== "[DONE]") {
          try {
            const parsed = JSON.parse(data);
            const content =
              parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              yield { type: "content", content };
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      yield { type: "stop" };
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    yield {
      type: "error",
      error: `Failed to stream from Grok: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Build a system prompt for Bible study context
 */
function buildSystemPrompt(context?: string): string {
  let prompt = `You are Manus, an expert Bible study mentor with deep knowledge of Hebrew and Greek biblical languages.

Your role is to:
1. Answer theological questions with biblical context
2. Explain Hebrew and Greek word meanings and their theological significance
3. Provide cross-references and related passages
4. Offer study guidance and interpretation insights
5. Keep responses clear, educational, and accessible

When discussing biblical terms:
- Explain the original Hebrew/Greek word and its Strong's number if available
- Provide the word's meaning and theological significance
- Give examples of how the word is used in Scripture
- Suggest related passages for deeper study

Keep responses concise but thorough (2-3 paragraphs typical).
Focus on biblical accuracy and scholarly insights.`;

  if (context) {
    prompt += `\n\nCurrent Study Context:\n${context}`;
  }

  return prompt;
}

/**
 * Get a full response from Grok (non-streaming)
 */
export async function getGrokResponse(
  messages: GrokMessage[],
  context?: string
): Promise<string> {
  let fullResponse = "";

  for await (const event of streamGrokResponse(messages, context)) {
    if (event.type === "content") {
      fullResponse += event.content || "";
    } else if (event.type === "error") {
      throw new Error(event.error);
    }
  }

  return fullResponse;
}
