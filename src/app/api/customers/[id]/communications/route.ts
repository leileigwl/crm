import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, canAccessCustomer } from '@/lib/auth';
import { analyzeCommunication } from '@/lib/communication-ai';
import { syncCommunicationToFeishu } from '@/lib/feishu-communication-sync';
import { createCommunication, getCustomerById, getCustomerOwnerMeta, listCommunicationsByCustomerId } from '@/storage/database/crm-repo';

// 获取客户的沟通记录
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const currentUser = await getCurrentUser();
		
		if (!currentUser) {
			return NextResponse.json(
				{ error: '未登录' },
				{ status: 401 }
			);
		}
		
		const { id } = await params;
		// 先检查客户权限
		const customer = await getCustomerOwnerMeta(id);
		
		if (!customer) {
			return NextResponse.json(
				{ error: '客户不存在' },
				{ status: 404 }
			);
		}
		
		if (!canAccessCustomer(currentUser, customer.owner_id)) {
			return NextResponse.json(
				{ error: '无权访问' },
				{ status: 403 }
			);
		}
		
		// 获取沟通记录
		const communications = await listCommunicationsByCustomerId(id);
		
		return NextResponse.json({ communications });
	} catch (error) {
		console.error('Get communications error:', error);
		return NextResponse.json(
			{ error: '获取沟通记录失败' },
			{ status: 500 }
		);
	}
}

// 添加沟通记录
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const currentUser = await getCurrentUser();
		
		if (!currentUser) {
			return NextResponse.json(
				{ error: '未登录' },
				{ status: 401 }
			);
		}
		
		const { id } = await params;
		const { content } = await request.json();
		
		if (!content || content.trim() === '') {
			return NextResponse.json(
				{ error: '沟通内容不能为空' },
				{ status: 400 }
			);
		}
		
		// 先检查客户权限
		const customer = await getCustomerOwnerMeta(id);
		
		if (!customer) {
			return NextResponse.json(
				{ error: '客户不存在' },
				{ status: 404 }
			);
		}
		
		if (!canAccessCustomer(currentUser, customer.owner_id)) {
			return NextResponse.json(
				{ error: '无权操作' },
				{ status: 403 }
			);
		}
		
		let aiResult = null;
		try {
			aiResult = await analyzeCommunication(content);
		} catch (error) {
			console.error('沟通AI分析失败:', error);
		}

		// 创建沟通记录
		const data = await createCommunication({
			customerId: id,
			userId: currentUser.id,
			content,
			aiSummary: aiResult?.summary ?? null,
			aiFollowUpAt: aiResult?.followUpAt ?? null,
		});

		try {
			const fullCustomer = await getCustomerById(id);
			if (fullCustomer) {
				await syncCommunicationToFeishu({
					customerCode: fullCustomer.customer_code,
					customerName: fullCustomer.name,
					ownerName: fullCustomer.crm_users.name,
					content: data.content,
					createdAt: data.created_at,
					aiSummary: data.ai_summary,
				});
			}
		} catch (error) {
			console.error('同步沟通记录到飞书失败:', error);
		}
		
		return NextResponse.json({
			success: true,
			communication: data,
		});
	} catch (error) {
		console.error('Create communication error:', error);
		return NextResponse.json(
			{ error: '添加沟通记录失败' },
			{ status: 500 }
		);
	}
}
