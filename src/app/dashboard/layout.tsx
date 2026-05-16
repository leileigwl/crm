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
import { Users, FileText, UserCog, LogOut, Settings } from 'lucide-react';

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
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
			</div>
		);
	}

	const navItems = [
		{ href: '/dashboard', label: '客户', fullLabel: '客户管理', icon: Users },
		{ href: '/communications', label: '跟进', fullLabel: '沟通记录', icon: FileText },
		...(user.role === 'admin'
			? [
					{ href: '/users', label: '成员', fullLabel: '用户管理', icon: UserCog },
					{ href: '/feishu-settings', label: '设置', fullLabel: '飞书设置', icon: Settings },
			  ]
			: []),
	];

	const currentPage = navItems.find((n) => n.href === pathname);

	return (
		<div className="min-h-screen bg-gray-50">

			{/* ── Desktop sidebar ── */}
			<aside className="hidden lg:flex lg:flex-col fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-100">
				<div className="px-5 py-5 border-b border-gray-100">
					<div className="flex items-center gap-2.5">
						<div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
							<span className="text-white font-bold text-sm">C</span>
						</div>
						<span className="font-bold text-gray-900">CMH CRM</span>
					</div>
				</div>

				<nav className="flex-1 px-3 py-4 space-y-1">
					{navItems.map((item) => {
						const isActive = pathname === item.href;
						return (
							<Link
								key={item.href}
								href={item.href}
								className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
									isActive
										? 'bg-blue-50 text-blue-600 font-medium'
										: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
								}`}
							>
								<item.icon className="h-4 w-4" />
								{item.fullLabel}
							</Link>
						);
					})}
				</nav>

				<div className="px-3 py-4 border-t border-gray-100">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left">
								<Avatar className="h-7 w-7">
									<AvatarFallback className="bg-blue-600 text-white text-xs">
										{user.name.charAt(0)}
									</AvatarFallback>
								</Avatar>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
									<p className="text-xs text-gray-400 truncate">
										{user.role === 'admin' ? '管理员' : '员工'}
									</p>
								</div>
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuLabel>
								<p className="text-xs text-gray-500 font-normal truncate">{user.email}</p>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
								<LogOut className="h-4 w-4 mr-2" />
								退出登录
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</aside>

			{/* ── Main content ── */}
			<div className="lg:pl-60 flex flex-col min-h-screen">

				{/* Desktop header */}
				<header className="hidden lg:flex sticky top-0 z-30 bg-white border-b border-gray-100 items-center justify-between px-6 h-14">
					<h2 className="text-sm font-medium text-gray-500">{currentPage?.fullLabel}</h2>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleLogout}
						className="text-gray-500 hover:text-red-600 text-xs"
					>
						<LogOut className="h-3.5 w-3.5 mr-1" />
						退出
					</Button>
				</header>

				{/* Mobile header */}
				<header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-12">
					<span className="font-semibold text-gray-900">{currentPage?.fullLabel ?? 'CMH CRM'}</span>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button>
								<Avatar className="h-7 w-7">
									<AvatarFallback className="bg-blue-600 text-white text-xs">
										{user.name.charAt(0)}
									</AvatarFallback>
								</Avatar>
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-44">
							<DropdownMenuLabel>
								<p className="font-medium">{user.name}</p>
								<p className="text-xs text-gray-400 font-normal">
									{user.role === 'admin' ? '管理员' : '员工'}
								</p>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
								<LogOut className="h-4 w-4 mr-2" />
								退出登录
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</header>

				{/* Page content — extra bottom padding for mobile nav */}
				<main className="flex-1 p-4 md:p-6 pb-24 lg:pb-6">{children}</main>
			</div>

			{/* ── Mobile bottom navigation ── */}
			<nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex safe-bottom">
				{navItems.map((item) => {
					const isActive = pathname === item.href;
					return (
						<Link
							key={item.href}
							href={item.href}
							className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-medium transition-colors ${
								isActive ? 'text-blue-600' : 'text-gray-400'
							}`}
						>
							<item.icon className="h-5 w-5" />
							{item.label}
						</Link>
					);
				})}
			</nav>
		</div>
	);
}
