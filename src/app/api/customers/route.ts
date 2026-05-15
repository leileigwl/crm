import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { createCustomerWithGeneratedCode } from '@/lib/customer-code';
import { syncCustomerToFeishu } from '@/lib/feishu-sync';
import { insertCustomerWithOwnerForRetry, listCustomers, updateCustomerFeishuRecordId } from '@/storage/database/crm-repo';

interface CreatedCustomer {
	id: string;
	customer_code: string;
	name: string;
	contact: string;
	city: string | null;
	ai_purpose: string | null;
	owner_id: string;
	created_at: string;
	crm_users: {
		id: string;
		name: string;
		email: string;
	};
	feishu_record_id?: string | null;
}

// 获取客户列表
export async function GET(request: NextRequest) {
	try {
		const currentUser = await getCurrentUser();
		
		if (!currentUser) {
			return NextResponse.json(
				{ error: '未登录' },
				{ status: 401 }
			);
		}
		
		const { searchParams } = new URL(request.url);
		const search = searchParams.get('search') || '';
		const page = parseInt(searchParams.get('page') || '1', 10);
		const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
		
		const { customers, total } = await listCustomers({
			currentUserId: currentUser.id,
			isAdmin: isAdmin(currentUser),
			search,
			page,
			pageSize,
		});
		
		return NextResponse.json({
			customers,
			total,
			page,
			pageSize,
		});
	} catch (error) {
		console.error('Get customers error:', error);
		return NextResponse.json(
			{ error: '获取客户列表失败' },
			{ status: 500 }
		);
	}
}

// 创建客户
export async function POST(request: NextRequest) {
	try {
		const currentUser = await getCurrentUser();
		
		if (!currentUser) {
			return NextResponse.json(
				{ error: '未登录' },
				{ status: 401 }
			);
		}
		
		const { name, contact, city, aiPurpose } = await request.json();
		
		if (!name || !contact) {
			return NextResponse.json(
				{ error: '姓名和联系方式不能为空' },
				{ status: 400 }
			);
		}
		
		const result = await createCustomerWithGeneratedCode<CreatedCustomer>({
			insertCustomer: async (customerCode) => {
				try {
					const data = await insertCustomerWithOwnerForRetry({
						customerCode,
						name,
						contact,
						city: city || null,
						aiPurpose: aiPurpose || null,
						ownerId: currentUser.id,
					});
					return { data, error: null };
				} catch (error) {
					return { data: null, error };
				}
			},
		});
		const data = result.data;

		if (!data) {
			throw new Error('Customer creation returned empty data');
		}
		
		try {
			const feishuRecordId = await syncCustomerToFeishu({
				id: data.id,
				customerCode: data.customer_code,
				name: data.name,
				contact: data.contact,
				city: data.city,
				aiPurpose: data.ai_purpose,
				ownerId: data.owner_id,
				createdAt: data.created_at,
			});

			if (feishuRecordId) {
				await updateCustomerFeishuRecordId(data.id, feishuRecordId);
				data.feishu_record_id = feishuRecordId;
				console.log('飞书记录ID已保存:', feishuRecordId);
			}
		} catch (err) {
			console.error('同步到飞书失败:', err);
		}
		
		return NextResponse.json({
			success: true,
			customer: data,
		});
	} catch (error) {
		console.error('Create customer error:', error);
		return NextResponse.json(
			{ error: '创建客户失败' },
			{ status: 500 }
		);
	}
}
