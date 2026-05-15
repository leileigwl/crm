'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2, UserCheck, UserX, Trash2 } from 'lucide-react';

interface User {
	id: string;
	email: string;
	name: string;
	role: 'admin' | 'staff';
	is_active: boolean;
	created_at: string;
}

export default function UsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [addLoading, setAddLoading] = useState(false);
	const [newUser, setNewUser] = useState({
		email: '',
		password: '',
		name: '',
		role: 'staff' as 'admin' | 'staff',
	});

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		setLoading(true);
		try {
			const response = await fetch('/api/users');
			const data = await response.json();
			if (response.ok) {
				setUsers(data.users || []);
			} else {
				alert(data.error || '获取用户列表失败');
			}
		} catch {
			alert('获取用户列表失败');
		} finally {
			setLoading(false);
		}
	};

	const handleToggleActive = async (userId: string, currentActive: boolean) => {
		try {
			const response = await fetch(`/api/users/${userId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isActive: !currentActive }),
			});

			if (response.ok) {
				fetchUsers();
			} else {
				const data = await response.json();
				alert(data.error || '操作失败');
			}
		} catch {
			alert('操作失败');
		}
	};

	const handleDeleteUser = async (userId: string) => {
		if (!confirm('确定要删除该用户吗？此操作不可恢复。')) return;

		try {
			const response = await fetch(`/api/users/${userId}`, {
				method: 'DELETE',
			});

			if (response.ok) {
				fetchUsers();
			} else {
				const data = await response.json();
				alert(data.error || '删除失败');
			}
		} catch {
			alert('删除失败');
		}
	};

	const handleAddUser = async () => {
		if (!newUser.email || !newUser.password || !newUser.name) {
			alert('请填写完整信息');
			return;
		}

		if (newUser.password.length < 6) {
			alert('密码至少6位');
			return;
		}

		setAddLoading(true);
		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newUser),
			});

			if (response.ok) {
				setShowAddDialog(false);
				setNewUser({ email: '', password: '', name: '', role: 'staff' });
				fetchUsers();
			} else {
				const data = await response.json();
				alert(data.error || '创建失败');
			}
		} catch {
			alert('创建失败');
		} finally {
			setAddLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
					<p className="text-gray-500 mt-1">管理系统用户账号和权限</p>
				</div>
				<Button onClick={() => setShowAddDialog(true)}>
					<Plus className="h-4 w-4 mr-2" />
					新增用户
				</Button>
			</div>

			<Card>
				<CardContent className="pt-6">
					{loading ? (
						<div className="flex justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>姓名</TableHead>
									<TableHead>邮箱</TableHead>
									<TableHead>角色</TableHead>
									<TableHead>状态</TableHead>
									<TableHead>创建时间</TableHead>
									<TableHead className="text-right">操作</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{users.map((user) => (
									<TableRow key={user.id}>
										<TableCell className="font-medium">{user.name}</TableCell>
										<TableCell>{user.email}</TableCell>
										<TableCell>
											<Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
												{user.role === 'admin' ? '管理员' : '员工'}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge variant={user.is_active ? 'default' : 'destructive'}>
												{user.is_active ? '正常' : '已禁用'}
											</Badge>
										</TableCell>
										<TableCell>
											{new Date(user.created_at).toLocaleDateString('zh-CN')}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleToggleActive(user.id, user.is_active)}
												>
													{user.is_active ? (
														<>
															<UserX className="h-4 w-4 mr-1" />
															禁用
														</>
													) : (
														<>
															<UserCheck className="h-4 w-4 mr-1" />
															启用
														</>
													)}
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleDeleteUser(user.id)}
													className="text-red-600 hover:text-red-700"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* 新增用户对话框 */}
			<Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>新增用户</DialogTitle>
						<DialogDescription>
							创建新的系统用户账号
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="name">姓名</Label>
							<Input
								id="name"
								value={newUser.name}
								onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
								placeholder="用户姓名"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">邮箱</Label>
							<Input
								id="email"
								type="email"
								value={newUser.email}
								onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
								placeholder="登录邮箱"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="password">密码</Label>
							<Input
								id="password"
								type="password"
								value={newUser.password}
								onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
								placeholder="至少6位"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="role">角色</Label>
							<Select
								value={newUser.role}
								onValueChange={(value) => setNewUser({ ...newUser, role: value as 'admin' | 'staff' })}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="staff">员工</SelectItem>
									<SelectItem value="admin">管理员</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowAddDialog(false)}>
							取消
						</Button>
						<Button onClick={handleAddUser} disabled={addLoading}>
							{addLoading ? '创建中...' : '确认创建'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
