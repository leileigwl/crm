'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, FileText, UserCog, LogOut, Menu, X, Settings } from 'lucide-react';

interface User {
	id: string;
	email: string;
	name: string;
	role: 'admin' | 'staff';
}

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const [user, setUser] = useState<User | null>(null);
	const [sidebarOpen, setSidebarOpen] = useState(false);

	useEffect(() => {
		fetch('/api/auth/me')
			.then((res) => res.json())
			.then((data) => {
				if (data.user) {
					setUser(data.user);
				} else {
					router.push('/');
				}
			})
			.catch(() => router.push('/'));
	}, [router]);

	const handleLogout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' });
		router.push('/');
	};

	if (!user) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	const navItems = [
		{ href: '/dashboard', label: '客户管理', icon: Users },
		{ href: '/communications', label: '沟通记录', icon: FileText },
		...(user.role === 'admin' ? [
			{ href: '/users', label: '用户管理', icon: UserCog },
			{ href: '/feishu-settings', label: '飞书设置', icon: Settings },
		] : []),
	];

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Mobile sidebar overlay */}
			{sidebarOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
					sidebarOpen ? 'translate-x-0' : '-translate-x-full'
				} lg:translate-x-0`}
			>
				<div className="flex items-center justify-between p-4 border-b">
					<h1 className="text-xl font-bold text-blue-600">CRM 系统</h1>
					<button
						className="lg:hidden p-1 rounded hover:bg-gray-100"
						onClick={() => setSidebarOpen(false)}
					>
						<X className="h-5 w-5" />
					</button>
				</div>
				<nav className="p-4 space-y-2">
					{navItems.map((item) => {
						const isActive = pathname === item.href;
						return (
							<Link
								key={item.href}
								href={item.href}
								className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
									isActive
										? 'bg-blue-50 text-blue-600 font-medium'
										: 'text-gray-600 hover:bg-gray-100'
								}`}
								onClick={() => setSidebarOpen(false)}
							>
								<item.icon className="h-5 w-5" />
								{item.label}
							</Link>
						);
					})}
				</nav>
			</aside>

			{/* Main content */}
			<div className="lg:pl-64">
				{/* Header */}
				<header className="sticky top-0 z-30 bg-white border-b shadow-sm">
					<div className="flex items-center justify-between px-4 py-3">
						<button
							className="lg:hidden p-2 rounded hover:bg-gray-100"
							onClick={() => setSidebarOpen(true)}
						>
							<Menu className="h-5 w-5" />
						</button>
						<div className="flex-1" />
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" className="flex items-center gap-2">
									<Avatar className="h-8 w-8">
										<AvatarFallback className="bg-blue-600 text-white text-sm">
											{user.name.charAt(0)}
										</AvatarFallback>
									</Avatar>
									<span className="hidden sm:inline">{user.name}</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48">
								<DropdownMenuLabel>
									<div className="flex flex-col">
										<span>{user.name}</span>
										<span className="text-xs text-gray-500 font-normal">{user.email}</span>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem className="text-gray-500">
									{user.role === 'admin' ? '管理员' : '员工'}
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleLogout} className="text-red-600">
									<LogOut className="h-4 w-4 mr-2" />
									退出登录
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>

				{/* Page content */}
				<main className="p-4 md:p-6">{children}</main>
			</div>
		</div>
	);
}
