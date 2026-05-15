# Drizzle Migration

这个目录保存 CRM 的数据库迁移。

约束：

- 本地数据库是主数据源
- 飞书多维表格同步能力保留
- `customers.feishu_record_id` 和 `system_config` 用于飞书同步，不能删

执行迁移前请设置以下任一环境变量：

- `DATABASE_URL`

常用命令：

```bash
pnpm db:generate
pnpm db:migrate
```
