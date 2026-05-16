export function extractJsonObject(content: string): Record<string, unknown> | null {
  const trimmed = content.trim();

  const direct = tryParseObject(trimmed);
  if (direct) {
    return direct;
  }

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    const parsed = tryParseObject(codeBlockMatch[1]);
    if (parsed) {
      return parsed;
    }
  }

  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return null;
  }

  return tryParseObject(jsonMatch[0]);
}

export function normalizeNullableString(value: unknown, maxLength = 500): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, maxLength);
}

function tryParseObject(content: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(content);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}
