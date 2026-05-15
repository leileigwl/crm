import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, canAccessCustomer } from '@/lib/auth';
import { syncCustomerToFeishu, deleteCustomerFromFeishu } from '@/lib/feishu-sync';
import { deleteCustomerById, getCustomerById, getCustomerOwnerMeta, updateCustomerById, updateCustomerFeishuRecordId } from '@/storage/database/crm-repo';

// 获取单个客户详情
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
		const customer = await getCustomerById(id);
		
		if (!customer) {
			return NextResponse.json(
				{ error: '客户不存在' },
				{ status: 404 }
			);
		}
		
		// 权限检查
		if (!canAccessCustomer(currentUser, customer.owner_id)) {
			return NextResponse.json(
				{ error: '无权访问该客户' },
				{ status: 403 }
			);
		}
		
		return NextResponse.json({ customer });
	} catch (error) {
		console.error('Get customer error:', error);
		return NextResponse.json(
			{ error: '获取客户信息失败' },
			{ status: 500 }
		);
	}
}

// 更新客户
export async function PUT(
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
		const { name, contact, city, aiPurpose } = await request.json();

		// 先检查权限并获取完整客户信息
		const existingCustomer = await getCustomerById(id);
		
		if (!existingCustomer) {
			return NextResponse.json(
				{ error: '客户不存在' },
				{ status: 404 }
			);
		}
		
		if (!canAccessCustomer(currentUser, existingCustomer.owner_id)) {
			return NextResponse.json(
				{ error: '无权修改该客户' },
				{ status: 403 }
			);
		}
		
		const data = await updateCustomerById({
			id,
			name,
			contact,
			city: city || null,
			aiPurpose: aiPurpose || null,
		});
		if (!data) {
			return NextResponse.json(
				{ error: '更新客户失败' },
				{ status: 500 }
			);
		}
		
		// 异步同步到飞书
		syncCustomerToFeishu({
			id: data.id,
			customerCode: data.customer_code,
			name: data.name,
			contact: data.contact,
			city: data.city,
			aiPurpose: data.ai_purpose,
			ownerId: data.owner_id,
			createdAt: data.created_at,
			feishuRecordId: data.feishu_record_id,
		}).then((feishuRecordId) => {
			if (feishuRecordId && !data.feishu_record_id) {
				// 如果是新增的飞书记录ID，保存到数据库
				updateCustomerFeishuRecordId(data.id, feishuRecordId).then(() => {
					console.log('飞书记录ID已保存:', feishuRecordId);
				});
			}
		}).catch((err) => {
			console.error('同步到飞书失败:', err);
		});
		
		return NextResponse.json({
			success: true,
			customer: data,
		});
	} catch (error) {
		console.error('Update customer error:', error);
		return NextResponse.json(
			{ error: '更新客户失败' },
			{ status: 500 }
		);
	}
}

// 删除客户
export async function DELETE(
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
		
		// 先检查权限并获取飞书记录ID
		const existingCustomer = await getCustomerOwnerMeta(id);
		
		if (!existingCustomer) {
			return NextResponse.json(
				{ error: '客户不存在' },
				{ status: 404 }
			);
		}
		
		if (!canAccessCustomer(currentUser, existingCustomer.owner_id)) {
			return NextResponse.json(
				{ error: '无权删除该客户' },
				{ status: 403 }
			);
		}
		
		await deleteCustomerById(id);
		
		// 异步删除飞书记录
		if (existingCustomer.feishu_record_id) {
			deleteCustomerFromFeishu(existingCustomer.feishu_record_id).catch((err) => {
				console.error('从飞书删除记录失败:', err);
			});
		}
		
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Delete customer error:', error);
		return NextResponse.json(
			{ error: '删除客户失败' },
			{ status: 500 }
		);
	}
}
