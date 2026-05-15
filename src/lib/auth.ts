import { cookies } from 'next/headers';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { findActiveUserById } from '@/storage/database/crm-repo';

export const SESSION_COOKIE_NAME = 'crm_session';
const SESSION_EXPIRY_DAYS = 7;
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_HASH_VERSION = 'scrypt';
const LEGACY_PASSWORD_SALT = 'crm_salt_2024';

export interface SessionUser {
	id: string;
	email: string;
	name: string;
	role: 'admin' | 'staff';
}

function getSessionSecret(): string {
	const secret = process.env.SESSION_SECRET;
	if (!secret) {
		throw new Error('SESSION_SECRET is not set');
	}
	return secret;
}

function hashLegacyPassword(password: string): string {
	return createHmac('sha256', LEGACY_PASSWORD_SALT).update(password).digest('hex');
}

function hashScryptPassword(password: string, salt?: string): string {
	const passwordSalt = salt ?? randomBytes(16).toString('hex');
	const derivedKey = scryptSync(password, passwordSalt, PASSWORD_KEY_LENGTH).toString('hex');
	return `${PASSWORD_HASH_VERSION}:${passwordSalt}:${derivedKey}`;
}

function verifyScryptPassword(password: string, storedHash: string): boolean {
	const [version, salt, derivedKey] = storedHash.split(':');
	if (version !== PASSWORD_HASH_VERSION || !salt || !derivedKey) {
		return false;
	}

	const calculated = scryptSync(password, salt, PASSWORD_KEY_LENGTH);
	const expected = Buffer.from(derivedKey, 'hex');

	if (calculated.length !== expected.length) {
		return false;
	}

	return timingSafeEqual(calculated, expected);
}

export async function hashPassword(password: string): Promise<string> {
	return hashScryptPassword(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	if (hash.startsWith(`${PASSWORD_HASH_VERSION}:`)) {
		return verifyScryptPassword(password, hash);
	}

	return timingSafeEqual(
		Buffer.from(hashLegacyPassword(password)),
		Buffer.from(hash)
	);
}

export function needsPasswordRehash(hash: string): boolean {
	return !hash.startsWith(`${PASSWORD_HASH_VERSION}:`);
}

// 创建会话
export function createSession(userId: string): string {
	const sessionData = {
		userId,
		createdAt: Date.now(),
		expiresAt: Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
	};
	const payload = Buffer.from(JSON.stringify(sessionData)).toString('base64url');
	const signature = createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
	return `${payload}.${signature}`;
}

// 验证会话
export async function verifySession(sessionToken: string): Promise<string | null> {
	try {
		const [payload, signature] = sessionToken.split('.');
		if (!payload || !signature) {
			return null;
		}

		const expectedSignature = createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
		if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
			return null;
		}

		const sessionData = JSON.parse(Buffer.from(payload, 'base64url').toString());
		if (sessionData.expiresAt < Date.now()) {
			return null;
		}
		return sessionData.userId;
	} catch {
		return null;
	}
}

// 获取当前用户
export async function getCurrentUser(): Promise<SessionUser | null> {
	const cookieStore = await cookies();
	const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
	
	if (!sessionToken) {
		return null;
	}
	
	const userId = await verifySession(sessionToken);
	if (!userId) {
		return null;
	}
	
	const data = await findActiveUserById(userId);
	if (!data) {
		return null;
	}
	
	return {
		id: data.id,
		email: data.email,
		name: data.name,
		role: data.role as 'admin' | 'staff',
	};
}

// 设置会话 Cookie
export async function setSessionCookie(sessionToken: string) {
	const cookieStore = await cookies();
	cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
		path: '/',
	});
}

// 清除会话 Cookie
export async function clearSessionCookie() {
	const cookieStore = await cookies();
	cookieStore.delete(SESSION_COOKIE_NAME);
}

// 检查是否是管理员
export function isAdmin(user: SessionUser | null): boolean {
	return user?.role === 'admin';
}

// 检查是否有权限访问客户数据
export function canAccessCustomer(user: SessionUser | null, customerOwnerId: string): boolean {
	if (!user) return false;
	if (user.role === 'admin') return true;
	return user.id === customerOwnerId;
}
