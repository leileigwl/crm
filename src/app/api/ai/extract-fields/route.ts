import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getCurrentUser } from '@/lib/auth';

const FIELD_EXTRACTION_PROMPT = `你是一个信息提取助手。请从用户输入的文本中提取以下字段，并以JSON格式返回：
- name: 客户姓名
- contact: 联系方式（手机号、微信等）
- city: 城市
- aiPurpose: 想用AI做什么

注意：
1. 如果某个字段无法从文本中提取，返回null
2. 联系方式要识别出是手机号还是微信号等
3. 只返回JSON，不要有其他说明文字

用户输入文本：`;

function extractByRule(text: string) {
	const mobileMatch = text.match(/1[3-9]\d{9}/);
	const wechatMatch = text.match(/(?:微信|vx|VX|wechat)[:：\s]*([a-zA-Z][a-zA-Z0-9_-]{5,19})/);
	const cityMatch = text.match(/(北京|上海|广州|深圳|杭州|苏州|南京|成都|重庆|武汉|西安|天津|长沙|郑州|青岛|宁波|厦门|合肥|济南|福州|东莞|佛山|无锡|昆明|沈阳|大连|哈尔滨|长春|南昌|贵阳|南宁|海口|石家庄|太原|兰州|乌鲁木齐|呼和浩特|银川|西宁|拉萨)(市)?/);
	const nameMatch = text.match(/(?:我是|叫|姓名|客户|联系人)[:：\s]*([\u4e00-\u9fa5]{2,4})/)
		|| text.match(/^([\u4e00-\u9fa5]{2,4})[，,、\s]/);

	return {
		name: nameMatch?.[1] || null,
		contact: mobileMatch?.[0] || wechatMatch?.[1] || null,
		city: cityMatch?.[1] || null,
		aiPurpose: text,
	};
}

async function extractByLLM(text: string, request: NextRequest) {
	const apiKey = process.env.DEEPSEEK_API_KEY;
	const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
	const model = process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';

	if (!apiKey) {
		return extractByRule(text);
	}

	const response = await axios.post(
		`${baseUrl}/chat/completions`,
		{
			model,
			messages: [
				{ role: 'system', content: '你是一个严谨的信息提取助手，只返回合法 JSON。' },
				{ role: 'user', content: FIELD_EXTRACTION_PROMPT + text },
			],
			temperature: 0.3,
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

	const content = response.data?.choices?.[0]?.message?.content;

	if (!content || typeof content !== 'string') {
		return extractByRule(text);
	}

	try {
		return JSON.parse(content);
	} catch {
		const jsonMatch = content.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			try {
				return JSON.parse(jsonMatch[0]);
			} catch {
				return extractByRule(text);
			}
		}

		return extractByRule(text);
	}
}

// AI字段提取
export async function POST(request: NextRequest) {
	try {
		const currentUser = await getCurrentUser();
		
		if (!currentUser) {
			return NextResponse.json(
				{ error: '未登录' },
				{ status: 401 }
			);
		}
		
		const { text } = await request.json();
		
		if (!text) {
			return NextResponse.json(
				{ error: '请提供文本内容' },
				{ status: 400 }
			);
		}

		let extractedFields;
		try {
			extractedFields = await extractByLLM(text, request);
		} catch {
			extractedFields = extractByRule(text);
		}
		
		return NextResponse.json({
			success: true,
			fields: extractedFields,
			rawText: text,
		});
	} catch (error) {
		console.error('AI extraction error:', error);
		return NextResponse.json(
			{ error: 'AI字段提取失败，请重试' },
			{ status: 500 }
		);
	}
}
