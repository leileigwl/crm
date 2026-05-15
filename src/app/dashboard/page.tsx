'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Wand2, Loader2, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

interface Customer {
	id: string;
	customer_code: string;
	name: string;
	contact: string;
	city: string | null;
	ai_purpose: string | null;
	owner_id: string;
	created_at: string;
	crm_users: {
		id: string;
		name: string;
		email: string;
	};
}

interface CustomersResponse {
	customers: Customer[];
	total: number;
	page: number;
	pageSize: number;
}

export default function DashboardPage() {
	const router = useRouter();
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [loading, setLoading] = useState(true);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const pageSize = 10;
	
	// 新增客户对话框
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [addLoading, setAddLoading] = useState(false);
	const [newCustomer, setNewCustomer] = useState({
		name: '',
		contact: '',
		city: '',
		aiPurpose: '',
	});
	
	// 智能识别
	const [rawText, setRawText] = useState('');
	const [extractLoading, setExtractLoading] = useState(false);

	const fetchCustomers = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				pageSize: pageSize.toString(),
				...(search && { search }),
			});
			const response = await fetch(`/api/customers?${params}`);
			const data: CustomersResponse = await response.json();
			setCustomers(data.customers || []);
			setTotal(data.total || 0);
		} catch (error) {
			console.error('获取客户列表失败:', error);
		} finally {
			setLoading(false);
		}
	}, [page, search]);

	useEffect(() => {
		fetchCustomers();
	}, [fetchCustomers]);

	// 搜索防抖
	useEffect(() => {
		const timer = setTimeout(() => {
			setPage(1);
			fetchCustomers();
		}, 300);
		return () => clearTimeout(timer);
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search]);

	// 添加客户
	const handleAddCustomer = async () => {
		if (!newCustomer.name || !newCustomer.contact) {
			alert('请填写姓名和联系方式');
			return;
		}

		setAddLoading(true);
		try {
			const response = await fetch('/api/customers', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newCustomer),
			});

			if (response.ok) {
				setShowAddDialog(false);
				setNewCustomer({ name: '', contact: '', city: '', aiPurpose: '' });
				setRawText('');
				fetchCustomers();
			} else {
				const data = await response.json();
				alert(data.error || '添加失败');
			}
		} catch {
			alert('添加失败');
		} finally {
			setAddLoading(false);
		}
	};

	// 删除客户
	const handleDeleteCustomer = async (id: string) => {
		if (!confirm('确定要删除这个客户吗？')) return;

		try {
			const response = await fetch(`/api/customers/${id}`, {
				method: 'DELETE',
			});

			if (response.ok) {
				fetchCustomers();
			} else {
				const data = await response.json();
				alert(data.error || '删除失败');
			}
		} catch {
			alert('删除失败');
		}
	};

	// AI 智能识别字段
	const handleExtractFields = async () => {
		if (!rawText.trim()) {
			alert('请先粘贴客户信息文字');
			return;
		}

		setExtractLoading(true);
		try {
			const response = await fetch('/api/ai/extract-fields', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text: rawText }),
			});

			const data = await response.json();

			if (data.success) {
				const fields = data.fields;
				setNewCustomer({
					name: fields.name || '',
					contact: fields.contact || '',
					city: fields.city || '',
					aiPurpose: fields.aiPurpose || rawText,
				});
			} else {
				alert('识别失败: ' + (data.error || '未知错误'));
			}
		} catch (error) {
			console.error('字段提取失败:', error);
			alert('识别失败，请重试');
		} finally {
			setExtractLoading(false);
		}
	};

	// 打开新增对话框时重置
	const handleOpenAddDialog = () => {
		setNewCustomer({ name: '', contact: '', city: '', aiPurpose: '' });
		setRawText('');
		setShowAddDialog(true);
	};

	const totalPages = Math.ceil(total / pageSize);

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">客户管理</h1>
					<p className="text-gray-500 mt-1">共 {total} 位客户</p>
				</div>
				<Button onClick={handleOpenAddDialog}>
					<Plus className="h-4 w-4 mr-2" />
					新增客户
				</Button>
			</div>

			<Card>
				<CardHeader className="pb-3">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="搜索客户姓名、联系方式、城市..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-10"
						/>
					</div>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex justify-center py-8">
							<Loader2 className="h-6 w-6 animate-spin text-gray-400" />
						</div>
					) : customers.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							暂无客户数据，点击&quot;新增客户&quot;添加第一位客户
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>客户编号</TableHead>
											<TableHead>姓名</TableHead>
											<TableHead>联系方式</TableHead>
											<TableHead>城市</TableHead>
											<TableHead>想用AI做什么</TableHead>
											<TableHead>跟进人</TableHead>
											<TableHead>创建时间</TableHead>
											<TableHead className="text-right">操作</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{customers.map((customer) => (
											<TableRow key={customer.id}>
												<TableCell>
													<Badge variant="outline" className="font-mono">
														{customer.customer_code}
													</Badge>
												</TableCell>
												<TableCell className="font-medium">{customer.name}</TableCell>
												<TableCell>{customer.contact}</TableCell>
												<TableCell>{customer.city || '-'}</TableCell>
												<TableCell className="max-w-[200px] truncate">
													{customer.ai_purpose || '-'}
												</TableCell>
												<TableCell>{customer.crm_users?.name || '-'}</TableCell>
												<TableCell>
													{new Date(customer.created_at).toLocaleDateString('zh-CN')}
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end gap-2">
														<Button
															variant="outline"
															size="sm"
															onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
														>
															详情
														</Button>
														<Button
															variant="outline"
															size="sm"
															onClick={() => handleDeleteCustomer(customer.id)}
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
							</div>

							{totalPages > 1 && (
								<div className="flex items-center justify-between mt-4 pt-4 border-t">
									<p className="text-sm text-gray-500">
										第 {page} 页，共 {totalPages} 页
									</p>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage((p) => Math.max(1, p - 1))}
											disabled={page === 1}
										>
											<ChevronLeft className="h-4 w-4" />
											上一页
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
											disabled={page === totalPages}
										>
											下一页
											<ChevronRight className="h-4 w-4" />
										</Button>
									</div>
								</div>
							)}
						</>
					)}
				</CardContent>
			</Card>

			{/* 新增客户对话框 */}
			<Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>新增客户</DialogTitle>
						<DialogDescription>
							粘贴客户信息文字，AI 会自动识别并填充字段
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						{/* 智能识别区域 */}
						<div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
							<div className="flex items-center justify-between">
								<Label className="text-blue-700">智能识别</Label>
								<Button
									size="sm"
									variant="outline"
									onClick={handleExtractFields}
									disabled={extractLoading || !rawText.trim()}
									className="bg-white"
								>
									{extractLoading ? (
										<Loader2 className="h-4 w-4 mr-1 animate-spin" />
									) : (
										<Wand2 className="h-4 w-4 mr-1" />
									)}
									一键识别
								</Button>
							</div>
							<Textarea
								placeholder="粘贴客户信息文字，例如：&#10;张三，电话13812345678，北京海淀，想学习AI写作提高工作效率"
								value={rawText}
								onChange={(e) => setRawText(e.target.value)}
								rows={3}
								className="bg-white"
							/>
							<p className="text-xs text-blue-600">
								提示：使用手机语音输入法，说完后复制粘贴到这里
							</p>
						</div>

						<div className="border-t pt-4">
							<p className="text-sm text-gray-500 mb-3">识别结果（可手动修改）：</p>
							
							<div className="space-y-3">
								<div className="space-y-1">
									<Label htmlFor="name">姓名 *</Label>
									<Input
										id="name"
										value={newCustomer.name}
										onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
										placeholder="客户姓名"
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="contact">联系方式 *</Label>
									<Input
										id="contact"
										value={newCustomer.contact}
										onChange={(e) => setNewCustomer({ ...newCustomer, contact: e.target.value })}
										placeholder="手机号/微信"
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="city">城市</Label>
									<Input
										id="city"
										value={newCustomer.city}
										onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
										placeholder="所在城市"
									/>
								</div>
								<div className="space-y-1">
									<Label htmlFor="aiPurpose">想用AI做什么</Label>
									<Textarea
										id="aiPurpose"
										value={newCustomer.aiPurpose}
										onChange={(e) => setNewCustomer({ ...newCustomer, aiPurpose: e.target.value })}
										placeholder="客户需求描述"
										rows={2}
									/>
								</div>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowAddDialog(false)}>
							取消
						</Button>
						<Button onClick={handleAddCustomer} disabled={addLoading}>
							{addLoading ? '添加中...' : '确认添加'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
