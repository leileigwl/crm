'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface FeishuConfig {
	appToken: string;
	tableId: string;
	configured: boolean;
}

export default function FeishuSettingsPage() {
	const router = useRouter();
	const [config, setConfig] = useState<FeishuConfig>({
		appToken: '',
		tableId: '',
		configured: false,
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [initializing, setInitializing] = useState(false);
	const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

	// 获取当前配置
	useEffect(() => {
		fetchConfig();
	}, []);

	const fetchConfig = async () => {
		try {
			const response = await fetch('/api/feishu/config');
			const data = await response.json();
			if (data.success) {
				setConfig(data.data);
			}
		} catch (error) {
			console.error('获取配置失败:', error);
		} finally {
			setLoading(false);
		}
	};

	// 保存配置
	const handleSave = async () => {
		setSaving(true);
		setMessage(null);
		try {
			const response = await fetch('/api/feishu/config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					appToken: config.appToken,
					tableId: config.tableId,
				}),
			});
			const data = await response.json();
			if (data.success) {
				setMessage({ type: 'success', text: '配置保存成功！' });
				setConfig((prev) => ({ ...prev, configured: true }));
			} else {
				setMessage({ type: 'error', text: data.error || '保存失败' });
			}
		} catch (error) {
			setMessage({ type: 'error', text: '保存失败，请重试' });
		} finally {
			setSaving(false);
		}
	};

	// 自动创建多维表格
	const handleInitialize = async () => {
		setInitializing(true);
		setMessage(null);
		try {
			const response = await fetch('/api/feishu/init', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: 'CRM客户管理' }),
			});
			const data = await response.json();
			if (data.success) {
				setConfig({
					appToken: data.data.appToken,
					tableId: data.data.tableId,
					configured: true,
				});
				setMessage({ type: 'success', text: '多维表格创建成功！配置已自动填充。' });
			} else {
				setMessage({ type: 'error', text: data.error || '创建失败' });
			}
		} catch (error) {
			setMessage({ type: 'error', text: '创建失败，请重试' });
		} finally {
			setInitializing(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="container max-w-2xl py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">飞书多维表格设置</h1>
				<p className="text-muted-foreground mt-2">
					配置飞书多维表格同步，客户信息将自动同步到飞书
				</p>
			</div>

			{/* 状态提示 */}
			<div className="mb-6">
				{config.configured ? (
					<Alert className="bg-green-50 border-green-200">
						<CheckCircle className="h-4 w-4 text-green-600" />
						<AlertDescription className="text-green-700">
							飞书多维表格已配置，客户信息将自动同步
						</AlertDescription>
					</Alert>
				) : (
					<Alert className="bg-yellow-50 border-yellow-200">
						<XCircle className="h-4 w-4 text-yellow-600" />
						<AlertDescription className="text-yellow-700">
							尚未配置飞书多维表格，客户信息不会同步
						</AlertDescription>
					</Alert>
				)}
			</div>

			{/* 快速初始化 */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>快速初始化</CardTitle>
					<CardDescription>
						点击按钮自动创建多维表格并完成配置
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						onClick={handleInitialize}
						disabled={initializing}
						className="w-full"
					>
						{initializing ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								正在创建...
							</>
						) : (
							'自动创建多维表格'
						)}
					</Button>
				</CardContent>
			</Card>

			{/* 手动配置 */}
			<Card>
				<CardHeader>
					<CardTitle>手动配置</CardTitle>
					<CardDescription>
						如果你已有飞书多维表格，可以手动填写配置信息
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">多维表格 App Token</label>
						<Input
							value={config.appToken}
							onChange={(e) => setConfig((prev) => ({ ...prev, appToken: e.target.value }))}
							placeholder="打开多维表格，URL 中的 app_token 部分"
						/>
						<p className="text-xs text-muted-foreground">
							URL 格式: https://xxx.feishu.cn/base/&lt;app_token&gt;?table=xxx
						</p>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">数据表 ID (Table ID)</label>
						<Input
							value={config.tableId}
							onChange={(e) => setConfig((prev) => ({ ...prev, tableId: e.target.value }))}
							placeholder="URL 中 table= 后面的部分"
						/>
					</div>

					{message && (
						<Alert className={message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
							<AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
								{message.text}
							</AlertDescription>
						</Alert>
					)}

					<div className="flex gap-4">
						<Button onClick={handleSave} disabled={saving}>
							{saving ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									保存中...
								</>
							) : (
								'保存配置'
							)}
						</Button>
						<Button variant="outline" onClick={() => router.push('/dashboard')}>
							返回首页
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* 字段说明 */}
			<Card className="mt-6">
				<CardHeader>
					<CardTitle>客户表字段要求</CardTitle>
					<CardDescription>
						客户主表需要包含以下字段
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-2 text-sm">
						<div className="flex items-center gap-2">
							<span className="font-medium">客户编号</span>
							<span className="text-muted-foreground">多行文本</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium">姓名</span>
							<span className="text-muted-foreground">多行文本</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium">联系方式</span>
							<span className="text-muted-foreground">电话号码</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium">城市</span>
							<span className="text-muted-foreground">多行文本</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium">想用AI做什么</span>
							<span className="text-muted-foreground">多行文本</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium">跟进人</span>
							<span className="text-muted-foreground">多行文本（自动填充）</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium">创建时间</span>
							<span className="text-muted-foreground">日期</span>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card className="mt-6">
				<CardHeader>
					<CardTitle>沟通表字段要求</CardTitle>
					<CardDescription>
						沟通记录表需要单独一张表，当前字段如下
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-2 text-sm">
						<div className="flex items-center gap-2">
							<span className="font-medium">客户编号</span>
							<span className="text-muted-foreground">多行文本</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium">客户姓名</span>
							<span className="text-muted-foreground">多行文本</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium">沟通时间</span>
							<span className="text-muted-foreground">日期</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium">沟通内容</span>
							<span className="text-muted-foreground">多行文本</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium">AI沟通摘要</span>
							<span className="text-muted-foreground">多行文本</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-medium">跟进人</span>
							<span className="text-muted-foreground">多行文本</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
