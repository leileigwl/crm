import axios from 'axios';

// 飞书 API 基础 URL
const FEISHU_API_BASE = 'https://open.feishu.cn/open-apis';

// 缓存 tenant_access_token
let cachedToken: { token: string; expireAt: number } | null = null;

function getFeishuAppCredentials() {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('FEISHU_APP_ID or FEISHU_APP_SECRET is not set');
  }

  return { appId, appSecret };
}

/**
 * 获取飞书 tenant_access_token
 */
export async function getTenantAccessToken(): Promise<string> {
  const { appId, appSecret } = getFeishuAppCredentials();

  // 检查缓存是否有效
  if (cachedToken && cachedToken.expireAt > Date.now()) {
    return cachedToken.token;
  }

  const response = await axios.post(
    `${FEISHU_API_BASE}/auth/v3/tenant_access_token/internal`,
    {
      app_id: appId,
      app_secret: appSecret,
    }
  );

  if (response.data.code !== 0) {
    throw new Error(`获取飞书 token 失败: ${response.data.msg}`);
  }

  const { tenant_access_token, expire } = response.data;
  
  // 缓存 token，提前 5 分钟过期
  cachedToken = {
    token: tenant_access_token,
    expireAt: Date.now() + (expire - 300) * 1000,
  };

  return tenant_access_token;
}

/**
 * 创建飞书请求的 headers
 */
export async function getFeishuHeaders() {
  const token = await getTenantAccessToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * 多维表格字段类型映射
 */
export const FieldType = {
  TEXT: 1,           // 多行文本
  NUMBER: 2,         // 数字
  SINGLE_SELECT: 3,  // 单选
  MULTI_SELECT: 4,   // 多选
  DATE: 5,           // 日期
  CHECKBOX: 7,       // 复选框
  USER: 11,          // 人员
  PHONE: 13,         // 电话号码
  URL: 15,           // 超链接
  ATTACHMENT: 17,    // 附件
  LOCATION: 18,      // 地理位置
} as const;

/**
 * 创建多维表格
 */
export async function createBitable(name: string, folderToken?: string) {
  const headers = await getFeishuHeaders();
  
  const response = await axios.post(
    `${FEISHU_API_BASE}/bitable/v1/apps`,
    {
      name,
      folder_token: folderToken || undefined,
    },
    { headers }
  );

  if (response.data.code !== 0) {
    throw new Error(`创建多维表格失败: ${response.data.msg}`);
  }

  return response.data.data;
}

/**
 * 获取多维表格信息
 */
export async function getBitable(appToken: string) {
  const headers = await getFeishuHeaders();
  
  const response = await axios.get(
    `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}`,
    { headers }
  );

  if (response.data.code !== 0) {
    throw new Error(`获取多维表格失败: ${response.data.msg}`);
  }

  return response.data.data;
}

/**
 * 创建数据表
 */
export async function createTable(appToken: string, table: {
  name: string;
  fields: Array<{
    field_name: string;
    type: number;
    property?: Record<string, unknown>;
  }>;
}) {
  const headers = await getFeishuHeaders();
  
  const response = await axios.post(
    `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables`,
    {
      table: {
        name: table.name,
        fields: table.fields,
      },
    },
    { headers }
  );

  if (response.data.code !== 0) {
    throw new Error(`创建数据表失败: ${response.data.msg}`);
  }

  return response.data.data;
}

/**
 * 添加记录
 */
export async function addRecord(appToken: string, tableId: string, fields: Record<string, unknown>) {
  const headers = await getFeishuHeaders();
  
  const response = await axios.post(
    `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    {
      fields,
    },
    { headers }
  );

  if (response.data.code !== 0) {
    throw new Error(`添加记录失败: ${response.data.msg}`);
  }

  return response.data.data;
}

/**
 * 更新记录
 */
export async function updateRecord(
  appToken: string,
  tableId: string,
  recordId: string,
  fields: Record<string, unknown>
) {
  const headers = await getFeishuHeaders();
  
  const response = await axios.put(
    `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
    { fields },
    { headers }
  );

  if (response.data.code !== 0) {
    throw new Error(`更新记录失败: ${response.data.msg}`);
  }

  return response.data.data;
}

/**
 * 删除记录
 */
export async function deleteRecord(appToken: string, tableId: string, recordId: string) {
  const headers = await getFeishuHeaders();
  
  const response = await axios.delete(
    `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
    { headers }
  );

  if (response.data.code !== 0) {
    throw new Error(`删除记录失败: ${response.data.msg}`);
  }

  return response.data.data;
}

/**
 * 查询记录
 */
export async function listRecords(
  appToken: string,
  tableId: string,
  options?: {
    view_id?: string;
    field_names?: string[];
    filter?: string;
    sort?: Array<{ field_name: string; desc?: boolean }>;
    page_size?: number;
    page_token?: string;
  }
) {
  const headers = await getFeishuHeaders();
  
  const params = new URLSearchParams();
  if (options?.view_id) params.append('view_id', options.view_id);
  if (options?.field_names) params.append('field_names', JSON.stringify(options.field_names));
  if (options?.filter) params.append('filter', options.filter);
  if (options?.sort) params.append('sort', JSON.stringify(options.sort));
  if (options?.page_size) params.append('page_size', options.page_size.toString());
  if (options?.page_token) params.append('page_token', options.page_token);

  const response = await axios.get(
    `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records?${params.toString()}`,
    { headers }
  );

  if (response.data.code !== 0) {
    throw new Error(`查询记录失败: ${response.data.msg}`);
  }

  return response.data.data;
}

/**
 * 搜索记录
 */
export async function searchRecords(
  appToken: string,
  tableId: string,
  condition: {
    field_name: string;
    operator: string;
    value: Array<string | number | boolean>;
  }[]
) {
  const headers = await getFeishuHeaders();
  
  const response = await axios.post(
    `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`,
    {
      automatic_fields: false,
      condition: {
        conjunction: 'and',
        conditions: condition.map((c) => ({
          field_name: c.field_name,
          operator: c.operator,
          value: c.value,
        })),
      },
    },
    { headers }
  );

  if (response.data.code !== 0) {
    throw new Error(`搜索记录失败: ${response.data.msg}`);
  }

  return response.data.data;
}

/**
 * 获取数据表列表
 */
export async function listTables(appToken: string) {
  const headers = await getFeishuHeaders();
  
  const response = await axios.get(
    `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables`,
    { headers }
  );

  if (response.data.code !== 0) {
    throw new Error(`获取数据表列表失败: ${response.data.msg}`);
  }

  return response.data.data;
}

/**
 * 获取字段列表
 */
export async function listFields(appToken: string, tableId: string) {
  const headers = await getFeishuHeaders();
  
  const response = await axios.get(
    `${FEISHU_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/fields`,
    { headers }
  );

  if (response.data.code !== 0) {
    throw new Error(`获取字段列表失败: ${response.data.msg}`);
  }

  return response.data.data;
}

/**
 * 飞书配置键
 */
export const FEISHU_CONFIG_KEYS = {
  APP_TOKEN: 'feishu_app_token',
  TABLE_ID: 'feishu_table_id',
  COMMUNICATION_TABLE_ID: 'feishu_communication_table_id',
};
