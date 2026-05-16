'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || '登录失败');
			} else {
				router.push('/dashboard');
			}
		} catch {
			setError('登录失败，请稍后重试');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#1a1f36] flex flex-col">
			{/* Header branding */}
			<div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
				<div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/30">
					<span className="text-white font-bold text-2xl">C</span>
				</div>
				<h1 className="text-3xl font-bold text-white tracking-tight">CMH CRM</h1>
				<p className="text-blue-200/70 mt-2 text-sm">客户关系管理系统</p>
			</div>

			{/* Login card */}
			<div className="bg-white rounded-t-3xl px-6 pt-8 pb-10 shadow-2xl w-full max-w-md mx-auto md:rounded-3xl md:mb-12 md:max-w-sm">
				<h2 className="text-xl font-semibold text-gray-900 mb-6">登录账号</h2>

				<form onSubmit={handleLogin} className="space-y-4">
					{error && (
						<Alert variant="destructive" className="py-2">
							<AlertDescription className="text-sm">{error}</AlertDescription>
						</Alert>
					)}

					<div className="space-y-1.5">
						<Label htmlFor="email" className="text-sm text-gray-600">邮箱</Label>
						<Input
							id="email"
							type="email"
							placeholder="请输入邮箱"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="h-11 bg-gray-50 border-gray-200"
							required
						/>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="password" className="text-sm text-gray-600">密码</Label>
						<Input
							id="password"
							type="password"
							placeholder="请输入密码"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="h-11 bg-gray-50 border-gray-200"
							required
						/>
					</div>

					<Button
						type="submit"
						className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium mt-2"
						disabled={loading}
					>
						{loading ? '登录中...' : '登录'}
					</Button>
				</form>

				<p className="text-center text-xs text-gray-400 mt-6">
					没有账号？联系管理员开通
				</p>
			</div>
		</div>
	);
}
