'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Tab = 'login' | 'register';

export default function LoginPage() {
	const router = useRouter();
	const [tab, setTab] = useState<Tab>('login');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [name, setName] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [loading, setLoading] = useState(false);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);
		try {
			const res = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error || '登录失败');
			} else {
				window.location.href = '/dashboard';
			}
		} catch {
			setError('登录失败，请稍后重试');
		} finally {
			setLoading(false);
		}
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setSuccess('');
		setLoading(true);
		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, name }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.error || '注册失败');
			} else {
				setSuccess('注册成功，请登录');
				setTab('login');
				setPassword('');
				setName('');
			}
		} catch {
			setError('注册失败，请稍后重试');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#1a1f36] flex flex-col">
			{/* 顶部品牌 */}
			<div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
				<div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30">
					<span className="text-white font-bold text-2xl">C</span>
				</div>
				<h1 className="text-3xl font-bold text-white tracking-tight">CMH CRM</h1>
				<p className="text-blue-200/70 mt-2 text-sm">客户关系管理系统</p>
			</div>

			{/* 表单卡片 */}
			<div className="bg-white rounded-t-3xl px-6 pt-6 pb-10 w-full max-w-md mx-auto md:rounded-3xl md:mb-12 md:max-w-sm">
				{/* Tab 切换 */}
				<div className="flex bg-gray-100 rounded-xl p-1 mb-6">
					<button
						onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
						className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
							tab === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
						}`}
					>
						登录
					</button>
					<button
						onClick={() => { setTab('register'); setError(''); setSuccess(''); }}
						className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
							tab === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
						}`}
					>
						注册
					</button>
				</div>

				{tab === 'login' ? (
					<form onSubmit={handleLogin} className="space-y-4">
						{error && <Alert variant="destructive" className="py-2"><AlertDescription className="text-sm">{error}</AlertDescription></Alert>}
						{success && <Alert className="py-2 bg-green-50 border-green-200"><AlertDescription className="text-sm text-green-700">{success}</AlertDescription></Alert>}
						<div className="space-y-1.5">
							<Label htmlFor="email" className="text-sm text-gray-600">邮箱</Label>
							<Input id="email" type="email" placeholder="请输入邮箱" value={email}
								onChange={(e) => setEmail(e.target.value)} className="h-11 bg-gray-50 border-gray-200" required />
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="password" className="text-sm text-gray-600">密码</Label>
							<Input id="password" type="password" placeholder="请输入密码" value={password}
								onChange={(e) => setPassword(e.target.value)} className="h-11 bg-gray-50 border-gray-200" required />
						</div>
						<Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 mt-2" disabled={loading}>
							{loading ? '登录中...' : '登录'}
						</Button>
					</form>
				) : (
					<form onSubmit={handleRegister} className="space-y-4">
						{error && <Alert variant="destructive" className="py-2"><AlertDescription className="text-sm">{error}</AlertDescription></Alert>}
						<div className="space-y-1.5">
							<Label htmlFor="name" className="text-sm text-gray-600">姓名</Label>
							<Input id="name" type="text" placeholder="请输入姓名" value={name}
								onChange={(e) => setName(e.target.value)} className="h-11 bg-gray-50 border-gray-200" required />
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="reg-email" className="text-sm text-gray-600">邮箱</Label>
							<Input id="reg-email" type="email" placeholder="请输入邮箱" value={email}
								onChange={(e) => setEmail(e.target.value)} className="h-11 bg-gray-50 border-gray-200" required />
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="reg-password" className="text-sm text-gray-600">密码</Label>
							<Input id="reg-password" type="password" placeholder="至少 6 位" value={password}
								onChange={(e) => setPassword(e.target.value)} className="h-11 bg-gray-50 border-gray-200" required minLength={6} />
						</div>
						<Button type="submit" className="w-full h-11 bg-blue-600 hover:bg-blue-700 mt-2" disabled={loading}>
							{loading ? '注册中...' : '注册'}
						</Button>
						<p className="text-center text-xs text-gray-400">注册后为员工角色，只能管理自己的客户</p>
					</form>
				)}
			</div>
		</div>
	);
}
