import axios from 'axios';
import { z } from 'zod';
import { extractJsonObject, normalizeNullableString } from '@/lib/ai-json';

export interface CommunicationAiResult {
  summary: string | null;
  followUpAt: string | null;
}

const COMMUNICATION_ANALYSIS_PROMPT = `你是 CRM 沟通分析助手。请从这段销售/客户沟通内容中提取结构化结果，并且只返回单个 JSON 对象：
{
  "summary": "本次主要沟通内容摘要，1-2句",
  "followUpAt": "如果文本里能判断明确跟进时间，返回 ISO 时间字符串；否则返回 null"
}

要求：
1. 只能输出合法 JSON，不要 markdown，不要解释
2. summary 必须是中文简短摘要，控制在 80 字内
3. followUpAt 只能是 ISO 时间字符串或 null
4. 如果文本没有明确下次时间，不要猜，返回 null
5. 不能输出额外字段`;

const communicationAiSchema = z.object({
  summary: z.string().nullable().optional(),
  followUpAt: z.string().nullable().optional(),
});

function normalizeFollowUpAt(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function buildFallbackSummary(content: string): string {
  const normalized = content
    .replace(/\s+/g, ' ')
    .replace(/[，。；！？]+/g, '，')
    .trim();

  if (!normalized) {
    return '已记录本次沟通内容';
  }

  return normalized.slice(0, 80);
}

function extractFollowUpAtByRule(content: string): string | null {
  const normalized = content.replace(/\s+/g, '');
  const fullDateMatch = normalized.match(/(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})[日号]?(?:[上下午晚晨中午]*)?(\d{1,2})?[点:：时]?(\d{1,2})?/);
  if (fullDateMatch) {
    const [, year, month, day, hour, minute] = fullDateMatch;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour || 10),
      Number(minute || 0),
      0,
      0
    );
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return null;
}

function normalizeCommunicationAiResult(content: string): CommunicationAiResult {
  const parsed = extractJsonObject(content);
  const result = parsed ? communicationAiSchema.safeParse(parsed) : null;
  const data = result?.success ? result.data : null;

  return {
    summary: normalizeNullableString(data?.summary, 80),
    followUpAt: normalizeFollowUpAt(data?.followUpAt),
  };
}

export async function analyzeCommunication(content: string): Promise<CommunicationAiResult | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

  if (!apiKey) {
    return {
      summary: buildFallbackSummary(content),
      followUpAt: extractFollowUpAtByRule(content),
    };
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model,
        messages: [
          { role: 'system', content: COMMUNICATION_ANALYSIS_PROMPT },
          { role: 'user', content },
        ],
        temperature: 0,
        stream: false,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const aiContent = response.data?.choices?.[0]?.message?.content;
    if (!aiContent || typeof aiContent !== 'string') {
      continue;
    }

    const normalized = normalizeCommunicationAiResult(aiContent);
    if (normalized.summary || normalized.followUpAt) {
      return normalized;
    }
  }

  return {
    summary: buildFallbackSummary(content),
    followUpAt: extractFollowUpAtByRule(content),
  };
}
