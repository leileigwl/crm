import { addRecord, FEISHU_CONFIG_KEYS } from '@/lib/feishu';
import { getSystemConfigValue } from '@/storage/database/crm-repo';

export async function syncCommunicationToFeishu(input: {
  customerCode: string;
  customerName: string;
  ownerName: string;
  content: string;
  createdAt: string;
  aiSummary?: string | null;
}) {
  const [appToken, tableId] = await Promise.all([
    getSystemConfigValue(FEISHU_CONFIG_KEYS.APP_TOKEN),
    getSystemConfigValue(FEISHU_CONFIG_KEYS.COMMUNICATION_TABLE_ID),
  ]);

  if (!appToken || !tableId) {
    return null;
  }

  const fields: Record<string, unknown> = {
    '客户编号': input.customerCode,
    '客户姓名': input.customerName,
    '沟通时间': new Date(input.createdAt).getTime(),
    '沟通内容': input.content,
    'AI沟通摘要': input.aiSummary || '',
    '跟进人': input.ownerName,
  };

  const result = await addRecord(appToken, tableId, fields);
  return result.record?.record_id ?? result.record_id ?? null;
}
