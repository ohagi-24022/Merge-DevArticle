import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice = ToolChoicePrimitive | ToolChoiceByName | ToolChoiceExplicit;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | {
      type: "json_schema";
      json_schema: {
        name: string;
        schema: Record<string, unknown>;
        strict?: boolean;
      };
    };

export type OutputSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
};

export type InvokeResult = {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
    };
  }>;
};

type GeminiPart = { text: string };
type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

const extractText = (content: MessageContent | MessageContent[]): string => {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part.type === "text") {
          return part.text;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  if (content.type === "text") {
    return content.text;
  }
  return "";
};

const toGeminiRole = (role: Role): "user" | "model" | null => {
  if (role === "user") {
    return "user";
  }
  if (role === "assistant") {
    return "model";
  }
  return null;
};

const buildGeminiPayload = (
  messages: Message[],
  responseFormat?: ResponseFormat,
) => {
  const systemParts: string[] = [];
  const contents: GeminiContent[] = [];

  for (const message of messages) {
    const text = extractText(message.content);
    if (!text) {
      continue;
    }

    if (message.role === "system") {
      systemParts.push(text);
      continue;
    }

    const role = toGeminiRole(message.role);
    if (!role) {
      contents.push({ role: "user", parts: [{ text: `[${message.role}]: ${text}` }] });
      continue;
    }

    contents.push({ role, parts: [{ text }] });
  }

  const payload: Record<string, unknown> = { contents };
  if (systemParts.length > 0) {
    payload.systemInstruction = {
      parts: [{ text: systemParts.join("\n\n") }],
    };
  }

  if (responseFormat?.type === "json_object" || responseFormat?.type === "json_schema") {
    payload.generationConfig = { responseMimeType: "application/json" };
  }

  return payload;
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}) => responseFormat || response_format || undefined;

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    responseFormat,
    response_format,
  } = params;

  if (tools && tools.length > 0) {
    throw new Error("Tool calling is not supported with Gemini in this app");
  }
  if (toolChoice || tool_choice) {
    throw new Error("Tool choice is not supported with Gemini in this app");
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
  });

  const payload = buildGeminiPayload(messages, normalizedResponseFormat);
  const baseUrl = ENV.geminiApiUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/models/${ENV.geminiModel}:generateContent?key=${encodeURIComponent(ENV.geminiApiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`,
    );
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";

  return {
    choices: [
      {
        message: {
          role: "assistant",
          content: text || null,
        },
      },
    ],
  };
}
