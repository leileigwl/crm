import { pgTable, serial, timestamp, varchar, boolean, uuid, text, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// 系统健康检查表（必须保留）
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 用户表
export const crmUsers = pgTable(
	"crm_users",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		email: varchar("email", { length: 255 }).notNull().unique(),
		passwordHash: varchar("password_hash", { length: 255 }).notNull(),
		name: varchar("name", { length: 128 }).notNull(),
		role: varchar("role", { length: 20 }).notNull().default('staff'), // 'admin' 或 'staff'
		isActive: boolean("is_active").default(true).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("crm_users_email_idx").on(table.email),
		index("crm_users_role_idx").on(table.role),
	]
);

// 客户表
export const customers = pgTable(
	"customers",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		customerCode: varchar("customer_code", { length: 32 }).notNull().unique(), // 唯一客户编码，如 CRM-20240101-0001
		name: varchar("name", { length: 128 }).notNull(),
		contact: varchar("contact", { length: 255 }).notNull(), // 联系方式（电话/微信等）
		city: varchar("city", { length: 64 }),
		aiPurpose: text("ai_purpose"), // 想用AI做什么
		ownerId: uuid("owner_id").notNull().references(() => crmUsers.id), // 跟进人ID
		feishuRecordId: varchar("feishu_record_id", { length: 64 }), // 飞书记录ID
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("customers_customer_code_idx").on(table.customerCode),
		index("customers_owner_id_idx").on(table.ownerId),
		index("customers_name_idx").on(table.name),
		index("customers_city_idx").on(table.city),
		index("customers_created_at_idx").on(table.createdAt),
	]
);

// 沟通记录表
export const communications = pgTable(
	"communications",
	{
		id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
		customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
		userId: uuid("user_id").notNull().references(() => crmUsers.id), // 沟通人ID
		content: text("content").notNull(), // 沟通内容
		aiSummary: text("ai_summary"),
		aiNextAction: text("ai_next_action"),
		aiFollowUpAt: timestamp("ai_follow_up_at", { withTimezone: true }),
		aiIntent: varchar("ai_intent", { length: 32 }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("communications_customer_id_idx").on(table.customerId),
		index("communications_user_id_idx").on(table.userId),
		index("communications_created_at_idx").on(table.createdAt),
	]
);

// 系统配置表（存储飞书等第三方配置）
export const systemConfig = pgTable(
	"system_config",
	{
		id: serial("id").primaryKey(),
		configKey: varchar("config_key", { length: 64 }).notNull().unique(),
		configValue: text("config_value").notNull(),
		description: varchar("description", { length: 255 }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("system_config_key_idx").on(table.configKey),
	]
);

// 类型导出
export type CrmUser = typeof crmUsers.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Communication = typeof communications.$inferSelect;
export type SystemConfig = typeof systemConfig.$inferSelect;
