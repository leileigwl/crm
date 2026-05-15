import { getSystemConfigValue, getUserNameById } from '@/storage/database/crm-repo';
import { addRecord, updateRecord, deleteRecord, FEISHU_CONFIG_KEYS } from '@/lib/feishu';

// 飞书配置键
const FEISHU_APP_TOKEN = FEISHU_CONFIG_KEYS.APP_TOKEN;
const FEISHU_TABLE_ID = FEISHU_CONFIG_KEYS.TABLE_ID;

/**
 * 获取飞书配置
 */
export async function getFeishuConfig(): Promise<{ appToken: string; tableId: string } | null> {
  try {
    const [appToken, tableId] = await Promise.all([
      getSystemConfigValue(FEISHU_APP_TOKEN),
      getSystemConfigValue(FEISHU_TABLE_ID),
    ]);

    if (!appToken || !tableId) {
      return null;
    }

    return { appToken, tableId };
  } catch (error) {
    console.error('获取飞书配置失败:', error);
    return null;
  }
}

/**
 * 同步客户到飞书多维表格
 */
export async function syncCustomerToFeishu(customer: {
  id: string;
  customerCode: string;
  name: string;
  contact: string;
  city: string | null;
  aiPurpose: string | null;
  ownerId: string;
  createdAt: string;
  feishuRecordId?: string | null;
}): Promise<string | null> {
  try {
    const config = await getFeishuConfig();
    if (!config) {
      console.log('飞书未配置，跳过同步');
      return null;
    }

    // 获取跟进人信息
    const ownerName = (await getUserNameById(customer.ownerId)) || '未知';

    // 构建飞书记录字段
    const fields: Record<string, unknown> = {
      '客户编号': customer.customerCode,
      '姓名': customer.name,
      '联系方式': customer.contact,
      '城市': customer.city || '',
      '想用AI做什么': customer.aiPurpose || '',
      '跟进人': ownerName,
      '创建时间': new Date(customer.createdAt).getTime(),
    };

    // 如果已有飞书记录ID，则更新；否则新建
    if (customer.feishuRecordId) {
      await updateRecord(config.appToken, config.tableId, customer.feishuRecordId, fields);
      return customer.feishuRecordId;
    } else {
      // 创建新记录
      const result = await addRecord(config.appToken, config.tableId, fields);
      return result.record?.record_id ?? result.record_id ?? null;
    }
  } catch (error) {
    console.error('同步客户到飞书失败:', error);
    return null;
  }
}

/**
 * 从飞书多维表格删除记录
 */
export async function deleteCustomerFromFeishu(feishuRecordId: string): Promise<boolean> {
  try {
    const config = await getFeishuConfig();
    if (!config) {
      return false;
    }

    await deleteRecord(config.appToken, config.tableId, feishuRecordId);
    return true;
  } catch (error) {
    console.error('从飞书删除记录失败:', error);
    return false;
  }
}
