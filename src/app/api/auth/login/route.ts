import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, createSession, setSessionCookie, hashPassword, needsPasswordRehash } from '@/lib/auth';
import { findActiveUserByEmail, updateUserPasswordHash } from '@/storage/database/crm-repo';

export async function POST(request: NextRequest) {
	try {
		const { email, password } = await request.json();
		
		if (!email || !password) {
			return NextResponse.json(
				{ error: '邮箱和密码不能为空' },
				{ status: 400 }
			);
		}
		
		const user = await findActiveUserByEmail(email);
		if (!user) {
			return NextResponse.json(
				{ error: '邮箱或密码错误' },
				{ status: 401 }
			);
		}
		
		const isValid = await verifyPassword(password, user.password_hash);
		if (!isValid) {
			return NextResponse.json(
				{ error: '邮箱或密码错误' },
				{ status: 401 }
			);
		}

		if (needsPasswordRehash(user.password_hash)) {
			const nextPasswordHash = await hashPassword(password);
			await updateUserPasswordHash(user.id, nextPasswordHash);
		}
		
		// 创建会话
		const sessionToken = createSession(user.id);
		await setSessionCookie(sessionToken);
		
		return NextResponse.json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				name: user.name,
				role: user.role,
			},
		});
	} catch (error) {
		console.error('Login error:', error);
		return NextResponse.json(
			{ error: '登录失败，请稍后重试' },
			{ status: 500 }
		);
	}
}
