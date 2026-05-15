import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { FEISHU_CONFIG_KEYS } from '@/lib/feishu';
import { getSystemConfigValue, upsertSystemConfig } from '@/storage/database/crm-repo';

// 飞书配置键
const FEISHU_APP_TOKEN = FEISHU_CONFIG_KEYS.APP_TOKEN;
const FEISHU_TABLE_ID = FEISHU_CONFIG_KEYS.TABLE_ID;

// 获取飞书配置
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '仅管理员可访问' }, { status: 403 });
    }

    const [appToken, tableId] = await Promise.all([
      getSystemConfigValue(FEISHU_APP_TOKEN),
      getSystemConfigValue(FEISHU_TABLE_ID),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        appToken,
        tableId,
        configured: !!(appToken && tableId),
      },
    });
  } catch (error) {
    console.error('获取飞书配置失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取配置失败' },
      { status: 500 }
    );
  }
}

// 保存飞书配置
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '仅管理员可访问' }, { status: 403 });
    }

    const body = await request.json();
    const { appToken, tableId } = body;

    if (!appToken || !tableId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }
    await Promise.all([
      upsertSystemConfig(FEISHU_APP_TOKEN, appToken, '飞书多维表格 App Token'),
      upsertSystemConfig(FEISHU_TABLE_ID, tableId, '飞书多维表格数据表 ID'),
    ]);

    return NextResponse.json({
      success: true,
      message: '飞书配置保存成功',
    });
  } catch (error) {
    console.error('保存飞书配置失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '保存配置失败' },
      { status: 500 }
    );
  }
}
