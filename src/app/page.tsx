'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LoginPage() {
	const router = useRouter();
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

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setSuccess('');
		setLoading(true);

		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, name }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || '注册失败');
			} else {
				setSuccess('注册成功！请登录您的账号');
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
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl font-bold">CRM 管理系统</CardTitle>
					<CardDescription>培训机构客户关系管理平台</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="login" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="login">登录</TabsTrigger>
							<TabsTrigger value="register">员工注册</TabsTrigger>
						</TabsList>
						
						<TabsContent value="login">
							<form onSubmit={handleLogin} className="space-y-4 mt-4">
								{error && (
									<Alert variant="destructive">
										<AlertDescription>{error}</AlertDescription>
									</Alert>
								)}
								<div className="space-y-2">
									<Label htmlFor="login-email">邮箱</Label>
									<Input
										id="login-email"
										type="email"
										placeholder="请输入邮箱"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="login-password">密码</Label>
									<Input
										id="login-password"
										type="password"
										placeholder="请输入密码"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
									/>
								</div>
								<Button type="submit" className="w-full" disabled={loading}>
									{loading ? '登录中...' : '登录'}
								</Button>
								<div className="mt-4 text-sm text-gray-500 text-center">
									<p>管理员账号由部署时初始化，不提供默认凭据。</p>
								</div>
							</form>
						</TabsContent>
						
						<TabsContent value="register">
							<form onSubmit={handleRegister} className="space-y-4 mt-4">
								{error && (
									<Alert variant="destructive">
										<AlertDescription>{error}</AlertDescription>
									</Alert>
								)}
								{success && (
									<Alert className="bg-green-50 border-green-200">
										<AlertDescription className="text-green-700">{success}</AlertDescription>
									</Alert>
								)}
								<div className="space-y-2">
									<Label htmlFor="register-name">姓名</Label>
									<Input
										id="register-name"
										type="text"
										placeholder="请输入您的姓名"
										value={name}
										onChange={(e) => setName(e.target.value)}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="register-email">邮箱</Label>
									<Input
										id="register-email"
										type="email"
										placeholder="请输入邮箱"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="register-password">密码</Label>
									<Input
										id="register-password"
										type="password"
										placeholder="请设置密码（至少6位）"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										minLength={6}
									/>
								</div>
								<Button type="submit" className="w-full" disabled={loading}>
									{loading ? '注册中...' : '注册'}
								</Button>
								<p className="text-xs text-gray-500 text-center">
									注册后将成为员工角色，只能管理自己跟进的客户
								</p>
							</form>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
