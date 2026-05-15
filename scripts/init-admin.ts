import dotenv from 'dotenv';
import { hashPassword } from '@/lib/auth';
import { createUser, findAnyAdmin } from '@/storage/database/crm-repo';

dotenv.config({ path: '.env.local' });
dotenv.config();

async function initAdmin() {
	const email = process.env.INIT_ADMIN_EMAIL;
	const password = process.env.INIT_ADMIN_PASSWORD;
	const name = process.env.INIT_ADMIN_NAME || '系统管理员';
	
	// 检查是否已存在管理员
	const existingAdmin = await findAnyAdmin();
	
	if (existingAdmin) {
		console.log('管理员账号已存在');
		return;
	}

	if (!email || !password) {
		throw new Error('INIT_ADMIN_EMAIL / INIT_ADMIN_PASSWORD is required');
	}

	if (password.length < 10) {
		throw new Error('INIT_ADMIN_PASSWORD must be at least 10 characters');
	}
	
	const passwordHash = await hashPassword(password);
	const data = await createUser({
		email,
		passwordHash,
		name,
		role: 'admin',
	});

	console.log('管理员账号创建成功:');
	console.log(`邮箱: ${data.email}`);
	console.log(`姓名: ${data.name}`);
}

initAdmin()
	.then(() => {
		process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
