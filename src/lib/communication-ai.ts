import axios from 'axios';

export interface CommunicationAiResult {
  summary: string | null;
  followUpAt: string | null;
}

const COMMUNICATION_ANALYSIS_PROMPT = `你是 CRM 沟通分析助手。请从这段销售/客户沟通内容中提取结构化结果，并且只返回 JSON：
{
  "summary": "本次主要沟通内容摘要，1-2句",
  "followUpAt": "如果文本里能判断明确跟进时间，返回 ISO 时间字符串；否则返回 null"
}

要求：
1. 只返回 JSON，不要解释
2. 如果无法判断，字段返回 null
3. summary 要简洁
4. 只保留必要字段，不要输出额外字段`;

function parseJson(content: string): CommunicationAiResult | null {
  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }
}

export async function analyzeCommunication(content: string): Promise<CommunicationAiResult | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

  if (!apiKey) {
    return null;
  }

  const response = await axios.post(
    `${baseUrl}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: COMMUNICATION_ANALYSIS_PROMPT },
        { role: 'user', content },
      ],
      temperature: 0.2,
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
    return null;
  }

  const parsed = parseJson(aiContent);
  if (!parsed) {
    return null;
  }

  return {
    summary: parsed.summary || null,
    followUpAt: parsed.followUpAt || null,
  };
}
