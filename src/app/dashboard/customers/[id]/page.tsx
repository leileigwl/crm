'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, Send, Calendar, User } from 'lucide-react';

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

interface Communication {
	id: string;
	content: string;
	ai_summary: string | null;
	ai_follow_up_at: string | null;
	created_at: string;
	crm_users: {
		id: string;
		name: string;
		email: string;
	};
}

export default function CustomerDetailPage() {
	const router = useRouter();
	const params = useParams();
	const customerId = params.id as string;

	const [customer, setCustomer] = useState<Customer | null>(null);
	const [communications, setCommunications] = useState<Communication[]>([]);
	const [loading, setLoading] = useState(true);
	const [editing, setEditing] = useState(false);
	const [editData, setEditData] = useState({
		name: '',
		contact: '',
		city: '',
		aiPurpose: '',
	});
	const [newCommunication, setNewCommunication] = useState('');
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		fetchCustomer();
		fetchCommunications();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [customerId]);

	const fetchCustomer = async () => {
		try {
			const response = await fetch(`/api/customers/${customerId}`);
			const data = await response.json();
			if (response.ok) {
				setCustomer(data.customer);
				setEditData({
					name: data.customer.name,
					contact: data.customer.contact,
					city: data.customer.city || '',
					aiPurpose: data.customer.ai_purpose || '',
				});
			} else {
				alert(data.error || '获取客户信息失败');
				router.push('/dashboard');
			}
		} catch {
			alert('获取客户信息失败');
			router.push('/dashboard');
		} finally {
			setLoading(false);
		}
	};

	const fetchCommunications = async () => {
		try {
			const response = await fetch(`/api/customers/${customerId}/communications`);
			const data = await response.json();
			if (response.ok) {
				setCommunications(data.communications || []);
			}
		} catch (error) {
			console.error('获取沟通记录失败:', error);
		}
	};

	const handleUpdate = async () => {
		setSubmitting(true);
		try {
			const response = await fetch(`/api/customers/${customerId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editData),
			});

			if (response.ok) {
				const data = await response.json();
				setCustomer(data.customer);
				setEditing(false);
			} else {
				const data = await response.json();
				alert(data.error || '更新失败');
			}
		} catch {
			alert('更新失败');
		} finally {
			setSubmitting(false);
		}
	};

	const handleAddCommunication = async () => {
		if (!newCommunication.trim()) return;

		setSubmitting(true);
		try {
			const response = await fetch(`/api/customers/${customerId}/communications`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: newCommunication }),
			});

			if (response.ok) {
				const data = await response.json();
				setCommunications([data.communication, ...communications]);
				setNewCommunication('');
			} else {
				const data = await response.json();
				alert(data.error || '添加失败');
			}
		} catch {
			alert('添加失败');
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-8 w-8 animate-spin text-gray-400" />
			</div>
		);
	}

	if (!customer) {
		return (
			<div className="text-center py-12 text-gray-500">
				客户不存在或无权访问
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					返回列表
				</Button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* 客户信息卡片 */}
				<div className="lg:col-span-1">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between">
							<CardTitle className="text-lg">客户信息</CardTitle>
							{!editing && (
								<Button variant="outline" size="sm" onClick={() => setEditing(true)}>
									编辑
								</Button>
							)}
						</CardHeader>
						<CardContent className="space-y-4">
							{editing ? (
								<>
									<div className="space-y-2">
										<Label>客户编号</Label>
										<Input value={customer.customer_code} disabled />
									</div>
									<div className="space-y-2">
										<Label>姓名 *</Label>
										<Input
											value={editData.name}
											onChange={(e) => setEditData({ ...editData, name: e.target.value })}
										/>
									</div>
									<div className="space-y-2">
										<Label>联系方式 *</Label>
										<Input
											value={editData.contact}
											onChange={(e) => setEditData({ ...editData, contact: e.target.value })}
										/>
									</div>
									<div className="space-y-2">
										<Label>城市</Label>
										<Input
											value={editData.city}
											onChange={(e) => setEditData({ ...editData, city: e.target.value })}
										/>
									</div>
									<div className="space-y-2">
										<Label>想用AI做什么</Label>
										<Textarea
											value={editData.aiPurpose}
											onChange={(e) => setEditData({ ...editData, aiPurpose: e.target.value })}
											rows={3}
										/>
									</div>
									<div className="flex gap-2 pt-2">
										<Button
											variant="outline"
											onClick={() => {
												setEditing(false);
												setEditData({
													name: customer.name,
													contact: customer.contact,
													city: customer.city || '',
													aiPurpose: customer.ai_purpose || '',
												});
											}}
										>
											取消
										</Button>
										<Button onClick={handleUpdate} disabled={submitting}>
											{submitting ? '保存中...' : '保存'}
										</Button>
									</div>
								</>
							) : (
								<>
									<div className="space-y-1">
										<p className="text-sm text-gray-500">客户编号</p>
										<Badge variant="outline" className="font-mono">
											{customer.customer_code}
										</Badge>
									</div>
									<div className="space-y-1">
										<p className="text-sm text-gray-500">姓名</p>
										<p className="font-medium">{customer.name}</p>
									</div>
									<div className="space-y-1">
										<p className="text-sm text-gray-500">联系方式</p>
										<p>{customer.contact}</p>
									</div>
									<div className="space-y-1">
										<p className="text-sm text-gray-500">城市</p>
										<p>{customer.city || '-'}</p>
									</div>
									<div className="space-y-1">
										<p className="text-sm text-gray-500">想用AI做什么</p>
										<p className="whitespace-pre-wrap">{customer.ai_purpose || '-'}</p>
									</div>
									<Separator />
									<div className="space-y-1">
										<p className="text-sm text-gray-500">跟进人</p>
										<div className="flex items-center gap-2">
											<User className="h-4 w-4 text-gray-400" />
											<span>{customer.crm_users?.name || '-'}</span>
										</div>
									</div>
									<div className="space-y-1">
										<p className="text-sm text-gray-500">创建时间</p>
										<div className="flex items-center gap-2">
											<Calendar className="h-4 w-4 text-gray-400" />
											<span>
												{new Date(customer.created_at).toLocaleString('zh-CN')}
											</span>
										</div>
									</div>
								</>
							)}
						</CardContent>
					</Card>
				</div>

				{/* 沟通记录 */}
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">沟通记录</CardTitle>
						</CardHeader>
						<CardContent>
							{/* 添加沟通记录 */}
							<div className="flex gap-2 mb-6">
								<Textarea
									placeholder="记录沟通内容..."
									value={newCommunication}
									onChange={(e) => setNewCommunication(e.target.value)}
									className="flex-1"
									rows={2}
								/>
								<Button
									onClick={handleAddCommunication}
									disabled={submitting || !newCommunication.trim()}
									className="self-end"
								>
									<Send className="h-4 w-4 mr-2" />
									发送
								</Button>
							</div>

							{/* 记录列表 */}
							<div className="space-y-4">
								{communications.length === 0 ? (
									<p className="text-center text-gray-500 py-8">暂无沟通记录</p>
								) : (
									communications.map((comm) => (
										<div
											key={comm.id}
											className="p-4 bg-gray-50 rounded-lg"
										>
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2">
													<User className="h-4 w-4 text-gray-400" />
													<span className="font-medium">{comm.crm_users?.name}</span>
												</div>
												<span className="text-sm text-gray-500">
													{new Date(comm.created_at).toLocaleString('zh-CN')}
												</span>
											</div>
											<p className="whitespace-pre-wrap">{comm.content}</p>
											{(comm.ai_summary || comm.ai_follow_up_at) && (
												<div className="mt-3 rounded-md border bg-white p-3 space-y-2">
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
										</div>
									))
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
