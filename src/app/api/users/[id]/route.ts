import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin, hashPassword } from '@/lib/auth';
import { deleteUserById, findUserByUsername, updateUserById } from '@/storage/database/crm-repo';

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
		const { isActive, username, name, password } = await request.json();
		
		let passwordHash: string | undefined;

		if (username) {
			if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username)) {
				return NextResponse.json(
					{ error: '用户名需为 3-32 位字母、数字、下划线或短横线' },
					{ status: 400 }
				);
			}

			const existingUser = await findUserByUsername(username);
			if (existingUser && existingUser.id !== id) {
				return NextResponse.json(
					{ error: '该用户名已存在' },
					{ status: 400 }
				);
			}
		}
		
		if (password && password.length >= 6) {
			passwordHash = await hashPassword(password);
		}
		
		await updateUserById({
			id,
			isActive,
			username,
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
