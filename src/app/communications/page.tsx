'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { Search, Loader2, User, Calendar, Send } from 'lucide-react';

interface Customer {
	id: string;
	customer_code: string;
	name: string;
	contact: string;
}

interface Communication {
	id: string;
	content: string;
	ai_summary: string | null;
	ai_follow_up_at: string | null;
	created_at: string;
	customer_id: string;
	crm_users: {
		id: string;
		name: string;
	};
	customers: Customer;
}

export default function CommunicationsPage() {
	const router = useRouter();
	const [communications, setCommunications] = useState<Communication[]>([]);
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [selectedCustomerId, setSelectedCustomerId] = useState('');
	const [newCommunication, setNewCommunication] = useState('');
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		fetchCommunications();
	}, []);

	const fetchCommunications = async () => {
		setLoading(true);
		try {
			// 获取所有客户，然后获取每个客户的沟通记录
			const customersRes = await fetch('/api/customers?pageSize=100');
			const customersData = await customersRes.json();
			setCustomers(customersData.customers || []);
			
			const allCommunications: Communication[] = [];
			
			for (const customer of customersData.customers || []) {
				const commRes = await fetch(`/api/customers/${customer.id}/communications`);
				const commData = await commRes.json();
				
				if (commData.communications) {
					allCommunications.push(
						...commData.communications.map((c: Communication) => ({
							...c,
							customers: {
								id: customer.id,
								customer_code: customer.customer_code,
								name: customer.name,
								contact: customer.contact,
							},
						}))
					);
				}
			}
			
			// 按时间排序
			allCommunications.sort(
				(a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
			);
			
			setCommunications(allCommunications);
		} catch (error) {
			console.error('获取沟通记录失败:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleAddCommunication = async () => {
		if (!selectedCustomerId || !newCommunication.trim()) return;

		setSubmitting(true);
		try {
			const response = await fetch(`/api/customers/${selectedCustomerId}/communications`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: newCommunication }),
			});
			const data = await response.json();

			if (!response.ok) {
				alert(data.error || '添加失败');
				return;
			}

			const customer = customers.find((item) => item.id === selectedCustomerId);
			if (customer) {
				setCommunications([
					{
						...data.communication,
						customer_id: customer.id,
						customers: customer,
					},
					...communications,
				]);
			}
			setNewCommunication('');
		} catch (error) {
			console.error('添加沟通记录失败:', error);
			alert('添加失败');
		} finally {
			setSubmitting(false);
		}
	};

	const filteredCommunications = communications.filter(
		(c) =>
			c.customers?.name?.toLowerCase().includes(search.toLowerCase()) ||
			c.customers?.customer_code?.toLowerCase().includes(search.toLowerCase()) ||
			c.content?.toLowerCase().includes(search.toLowerCase()) ||
			c.crm_users?.name?.toLowerCase().includes(search.toLowerCase())
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">沟通记录</h1>
					<p className="text-gray-500 mt-1">所有客户的沟通历史</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">新增沟通记录</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="选择一个已有客户" />
						</SelectTrigger>
						<SelectContent>
							{customers.map((customer) => (
								<SelectItem key={customer.id} value={customer.id}>
									{customer.customer_code} · {customer.name} · {customer.contact}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Textarea
						placeholder="输入这一次新的沟通内容..."
						value={newCommunication}
						onChange={(e) => setNewCommunication(e.target.value)}
						rows={4}
					/>
					<div className="flex justify-end">
						<Button
							onClick={handleAddCommunication}
							disabled={submitting || !selectedCustomerId || !newCommunication.trim()}
						>
							<Send className="h-4 w-4 mr-2" />
							{submitting ? '保存中...' : '保存沟通记录'}
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="pb-3">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="搜索客户姓名、编号、内容..."
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
					) : filteredCommunications.length === 0 ? (
						<div className="text-center py-8 text-gray-500">
							暂无沟通记录
						</div>
					) : (
						<div className="space-y-4">
							{filteredCommunications.map((comm) => (
								<div
									key={comm.id}
									className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
								>
									<div className="space-y-3">
										<div className="flex items-center justify-between gap-2">
											<div className="flex items-center gap-2 min-w-0 flex-1">
												<span className="font-medium shrink-0">{comm.customers?.name}</span>
												<span className="text-sm text-gray-500 truncate">{comm.customers?.contact}</span>
											</div>
											<Button
												variant="outline"
												size="sm"
												className="shrink-0 text-xs h-7 px-2"
												onClick={() => router.push(`/dashboard/customers/${comm.customer_id}`)}
											>
												查看客户
											</Button>
										</div>
										<Badge variant="outline" className="font-mono text-xs">
											{comm.customers?.customer_code}
										</Badge>
										<p className="text-gray-700 whitespace-pre-wrap">{comm.content}</p>
										{(comm.ai_summary || comm.ai_follow_up_at) && (
											<div className="rounded-md border bg-white p-3 space-y-2">
												{comm.ai_summary && (
													<div>
														<p className="text-xs text-gray-500">AI 摘要</p>
														<p className="text-sm text-gray-800">{comm.ai_summary}</p>
													</div>
												)}
												<div className="flex flex-wrap gap-3 text-sm text-gray-600">
													{comm.ai_follow_up_at && (
														<span>建议跟进：{new Date(comm.ai_follow_up_at).toLocaleString('zh-CN')}</span>
													)}
												</div>
											</div>
										)}
										<div className="flex items-center gap-4 text-sm text-gray-500">
											<div className="flex items-center gap-1">
												<User className="h-4 w-4" />
												{comm.crm_users?.name}
											</div>
											<div className="flex items-center gap-1">
												<Calendar className="h-4 w-4" />
												{new Date(comm.created_at).toLocaleString('zh-CN')}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
