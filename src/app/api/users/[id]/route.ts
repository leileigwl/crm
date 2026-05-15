import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin, hashPassword } from '@/lib/auth';
import { deleteUserById, updateUserById } from '@/storage/database/crm-repo';

// 更新用户状态（仅管理员）
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const currentUser = await getCurrentUser();
		
		if (!isAdmin(currentUser)) {
			return NextResponse.json(
				{ error: '权限不足' },
				{ status: 403 }
			);
		}
		
		const { id } = await params;
		const { isActive, name, password } = await request.json();
		
		let passwordHash: string | undefined;
		
		if (password && password.length >= 6) {
			passwordHash = await hashPassword(password);
		}
		
		await updateUserById({
			id,
			isActive,
			name,
			passwordHash,
		});
		
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Update user error:', error);
		return NextResponse.json(
			{ error: '更新用户失败' },
			{ status: 500 }
		);
	}
}

// 删除用户（仅管理员）
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const currentUser = await getCurrentUser();
		
		if (!isAdmin(currentUser)) {
			return NextResponse.json(
				{ error: '权限不足' },
				{ status: 403 }
			);
		}
		
		const { id } = await params;
		
		// 不能删除自己
		if (id === currentUser!.id) {
			return NextResponse.json(
				{ error: '不能删除自己的账号' },
				{ status: 400 }
			);
		}
		
		await deleteUserById(id);
		
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Delete user error:', error);
		return NextResponse.json(
			{ error: '删除用户失败' },
			{ status: 500 }
		);
	}
}
