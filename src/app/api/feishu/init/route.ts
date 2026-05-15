import { NextRequest, NextResponse } from 'next/server';
import { createBitable, createTable, listTables, listFields, FieldType } from '@/lib/feishu';

// CRM 客户表字段定义
const CUSTOMER_TABLE_FIELDS = [
  { field_name: '客户编号', type: FieldType.TEXT },
  { field_name: '姓名', type: FieldType.TEXT },
  { field_name: '联系方式', type: FieldType.PHONE },
  { field_name: '城市', type: FieldType.TEXT },
  { field_name: '想用AI做什么', type: FieldType.TEXT },
  { field_name: '跟进人', type: FieldType.TEXT },
  { field_name: '创建时间', type: FieldType.DATE },
];

const COMMUNICATION_TABLE_FIELDS = [
  { field_name: '客户编号', type: FieldType.TEXT },
  { field_name: '客户姓名', type: FieldType.TEXT },
  { field_name: '沟通时间', type: FieldType.DATE },
  { field_name: '沟通内容', type: FieldType.TEXT },
  { field_name: 'AI沟通摘要', type: FieldType.TEXT },
  { field_name: '跟进人', type: FieldType.TEXT },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, folderToken } = body;

    // 创建多维表格
    const bitableName = name || 'CRM客户管理';
    const bitable = await createBitable(bitableName, folderToken);
    const appToken = bitable.app.token;

    // 创建客户数据表
    const customerTable = await createTable(appToken, {
      name: '客户信息',
      fields: CUSTOMER_TABLE_FIELDS,
    });

    const communicationTable = await createTable(appToken, {
      name: '沟通记录',
      fields: COMMUNICATION_TABLE_FIELDS,
    });

    return NextResponse.json({
      success: true,
      data: {
        appToken,
        customerTable: {
          tableName: customerTable.name,
          tableId: customerTable.table_id,
          fields: customerTable.fields,
        },
        communicationTable: {
          tableName: communicationTable.name,
          tableId: communicationTable.table_id,
          fields: communicationTable.fields,
        },
      },
    });
  } catch (error) {
    console.error('初始化飞书多维表格失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '初始化失败' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appToken = searchParams.get('appToken');

    if (!appToken) {
      return NextResponse.json({ error: '缺少 appToken 参数' }, { status: 400 });
    }

    // 获取数据表列表
    const tables = await listTables(appToken);

    // 获取每个表的字段
    const tablesWithFields = await Promise.all(
      tables.items.map(async (table: { table_id: string; name: string }) => {
        const fields = await listFields(appToken, table.table_id);
        return {
          tableId: table.table_id,
          tableName: table.name,
          fields: fields.items,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        appToken,
        tables: tablesWithFields,
      },
    });
  } catch (error) {
    console.error('获取飞书多维表格信息失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取失败' },
      { status: 500 }
    );
  }
}
