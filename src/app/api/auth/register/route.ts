import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, getCurrentUser, isAdmin } from '@/lib/auth';
import { createUser, findUserByEmail, findUserByUsername } from '@/storage/database/crm-repo';

export async function POST(request: NextRequest) {
	try {
		const currentUser = await getCurrentUser();
		const { email, username, password, name, role } = await request.json();
		
		// 判断是否为管理员创建用户
		const isAdminCreating = isAdmin(currentUser);
		
		// 如果是管理员创建用户，需要验证权限
		// 如果是员工自己注册，role 强制为 staff
		if (!email || !username || !password || !name) {
			return NextResponse.json(
				{ error: '用户名、邮箱、密码和姓名不能为空' },
				{ status: 400 }
			);
		}

		if (!/^[a-zA-Z0-9_-]{3,32}$/.test(username)) {
			return NextResponse.json(
				{ error: '用户名需为 3-32 位字母、数字、下划线或短横线' },
				{ status: 400 }
			);
		}
		
		if (password.length < 6) {
			return NextResponse.json(
				{ error: '密码至少6位' },
				{ status: 400 }
			);
		}
		
		// 检查邮箱是否已存在
		const existingUser = await findUserByEmail(email);
		
		if (existingUser) {
			return NextResponse.json(
				{ error: '该邮箱已被注册' },
				{ status: 400 }
			);
		}

		const existingUsername = await findUserByUsername(username);
		if (existingUsername) {
			return NextResponse.json(
				{ error: '该用户名已存在' },
				{ status: 400 }
			);
		}
		
		// 创建用户
		// 如果是员工自己注册，强制为 staff 角色
		// 如果是管理员创建，可以使用指定的角色
		const passwordHash = await hashPassword(password);
		const userRole = isAdminCreating ? (role || 'staff') : 'staff';
		
		const newUser = await createUser({
			email,
			username,
			passwordHash,
			name,
			role: userRole,
		});
		
		return NextResponse.json({
			success: true,
			user: newUser,
		});
	} catch (error) {
		console.error('Register error:', error);
		return NextResponse.json(
			{ error: '注册失败，请稍后重试' },
			{ status: 500 }
		);
	}
}
