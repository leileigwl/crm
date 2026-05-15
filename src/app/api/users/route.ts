import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { listUsers } from '@/storage/database/crm-repo';

// 获取用户列表（仅管理员）
export async function GET() {
	try {
		const currentUser = await getCurrentUser();
		
		if (!isAdmin(currentUser)) {
			return NextResponse.json(
				{ error: '权限不足，只有管理员可以查看用户列表' },
				{ status: 403 }
			);
		}
		
		const users = await listUsers();
		
		return NextResponse.json({ users });
	} catch (error) {
		console.error('Get users error:', error);
		return NextResponse.json(
			{ error: '获取用户列表失败' },
			{ status: 500 }
		);
	}
}
