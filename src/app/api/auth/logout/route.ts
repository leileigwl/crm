import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
	try {
		// 创建响应并设置过期的 cookie 来清除
		const response = NextResponse.json({ success: true });
		response.cookies.set(SESSION_COOKIE_NAME, '', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 0, // 立即过期
			path: '/',
		});
		return response;
	} catch (error) {
		console.error('Logout error:', error);
		return NextResponse.json(
			{ error: '退出登录失败' },
			{ status: 500 }
		);
	}
}
