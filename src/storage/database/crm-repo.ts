import { queryDb } from '@/storage/database/local-db';

export interface DbUser {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'staff';
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface DbCustomerWithOwner {
  id: string;
  customer_code: string;
  name: string;
  contact: string;
  city: string | null;
  ai_purpose: string | null;
  owner_id: string;
  feishu_record_id: string | null;
  created_at: string;
  updated_at: string | null;
  crm_users: {
    id: string;
    name: string;
    email: string;
  };
}

export interface DbCommunicationWithUser {
  id: string;
  customer_id: string;
  user_id: string;
  content: string;
  ai_summary: string | null;
  ai_next_action: string | null;
  ai_follow_up_at: string | null;
  ai_intent: string | null;
  created_at: string;
  crm_users: {
    id: string;
    name: string;
    email: string;
  };
}

function mapCustomerWithOwner(row: Record<string, unknown>): DbCustomerWithOwner {
  return {
    id: String(row.id),
    customer_code: String(row.customer_code),
    name: String(row.name),
    contact: String(row.contact),
    city: row.city ? String(row.city) : null,
    ai_purpose: row.ai_purpose ? String(row.ai_purpose) : null,
    owner_id: String(row.owner_id),
    feishu_record_id: row.feishu_record_id ? String(row.feishu_record_id) : null,
    created_at: String(row.created_at),
    updated_at: row.updated_at ? String(row.updated_at) : null,
    crm_users: {
      id: String(row.owner_user_id),
      name: String(row.owner_user_name),
      email: String(row.owner_user_email),
    },
  };
}

function mapCommunicationWithUser(row: Record<string, unknown>): DbCommunicationWithUser {
  return {
    id: String(row.id),
    customer_id: String(row.customer_id),
    user_id: String(row.user_id),
    content: String(row.content),
    ai_summary: row.ai_summary ? String(row.ai_summary) : null,
    ai_next_action: row.ai_next_action ? String(row.ai_next_action) : null,
    ai_follow_up_at: row.ai_follow_up_at ? String(row.ai_follow_up_at) : null,
    ai_intent: row.ai_intent ? String(row.ai_intent) : null,
    created_at: String(row.created_at),
    crm_users: {
      id: String(row.comm_user_id),
      name: String(row.comm_user_name),
      email: String(row.comm_user_email),
    },
  };
}

export async function findActiveUserById(id: string) {
  const result = await queryDb<DbUser>(
    `select id, email, username, password_hash, name, role, is_active, created_at, updated_at
     from crm_users
     where id = $1 and is_active = true
     limit 1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function findActiveUserByEmail(email: string) {
  const result = await queryDb<DbUser>(
    `select id, email, username, password_hash, name, role, is_active, created_at, updated_at
     from crm_users
     where email = $1 and is_active = true
     limit 1`,
    [email]
  );
  return result.rows[0] ?? null;
}

export async function findUserByEmail(email: string) {
  const result = await queryDb<DbUser>(
    `select id, email, username, password_hash, name, role, is_active, created_at, updated_at
     from crm_users
     where email = $1
     limit 1`,
    [email]
  );
  return result.rows[0] ?? null;
}

export async function findUserByUsername(username: string) {
  const result = await queryDb<DbUser>(
    `select id, email, username, password_hash, name, role, is_active, created_at, updated_at
     from crm_users
     where username = $1
     limit 1`,
    [username]
  );
  return result.rows[0] ?? null;
}

export async function updateUserPasswordHash(id: string, passwordHash: string) {
  await queryDb(
    `update crm_users
     set password_hash = $2, updated_at = now()
     where id = $1`,
    [id, passwordHash]
  );
}

export async function createUser(input: {
  email: string;
  username: string;
  passwordHash: string;
  name: string;
  role: 'admin' | 'staff';
}) {
  const result = await queryDb<Pick<DbUser, 'id' | 'email' | 'username' | 'name' | 'role'>>(
    `insert into crm_users (email, username, password_hash, name, role)
     values ($1, $2, $3, $4, $5)
     returning id, email, username, name, role`,
    [input.email, input.username, input.passwordHash, input.name, input.role]
  );
  return result.rows[0];
}

export async function listUsers() {
  const result = await queryDb(
    `select id, email, username, name, role, is_active, created_at, updated_at
     from crm_users
     order by created_at desc`
  );
  return result.rows;
}

export async function updateUserById(input: {
  id: string;
  isActive?: boolean;
  username?: string;
  name?: string;
  passwordHash?: string;
}) {
  const assignments: string[] = ['updated_at = now()'];
  const values: unknown[] = [input.id];
  let position = 2;

  if (typeof input.isActive === 'boolean') {
    assignments.push(`is_active = $${position++}`);
    values.push(input.isActive);
  }
  if (input.username) {
    assignments.push(`username = $${position++}`);
    values.push(input.username);
  }
  if (input.name) {
    assignments.push(`name = $${position++}`);
    values.push(input.name);
  }
  if (input.passwordHash) {
    assignments.push(`password_hash = $${position++}`);
    values.push(input.passwordHash);
  }

  await queryDb(`update crm_users set ${assignments.join(', ')} where id = $1`, values);
}

export async function deleteUserById(id: string) {
  await queryDb(`delete from crm_users where id = $1`, [id]);
}

export async function findAnyAdmin() {
  const result = await queryDb<{ id: string }>(
    `select id from crm_users where role = 'admin' limit 1`
  );
  return result.rows[0] ?? null;
}

export async function getSystemConfigValue(configKey: string) {
  const result = await queryDb<{ config_value: string }>(
    `select config_value from system_config where config_key = $1 limit 1`,
    [configKey]
  );
  return result.rows[0]?.config_value ?? null;
}

export async function upsertSystemConfig(configKey: string, configValue: string, description: string) {
  await queryDb(
    `insert into system_config (config_key, config_value, description)
     values ($1, $2, $3)
     on conflict (config_key)
     do update set config_value = excluded.config_value, updated_at = now()`,
    [configKey, configValue, description]
  );
}

export async function getUserNameById(id: string) {
  const result = await queryDb<{ name: string }>(
    `select name from crm_users where id = $1 limit 1`,
    [id]
  );
  return result.rows[0]?.name ?? null;
}

export async function listCustomers(params: {
  currentUserId: string;
  isAdmin: boolean;
  search: string;
  page: number;
  pageSize: number;
}) {
  const where: string[] = [];
  const values: unknown[] = [];

  if (!params.isAdmin) {
    values.push(params.currentUserId);
    where.push(`c.owner_id = $${values.length}`);
  }

  if (params.search) {
    values.push(`%${params.search}%`);
    const idx = values.length;
    where.push(`(c.name ilike $${idx} or c.contact ilike $${idx} or c.city ilike $${idx} or c.customer_code ilike $${idx})`);
  }

  const whereSql = where.length > 0 ? `where ${where.join(' and ')}` : '';
  const offset = (params.page - 1) * params.pageSize;

  const dataValues = [...values, params.pageSize, offset];
  const data = await queryDb(
    `select
        c.*,
        u.id as owner_user_id,
        u.name as owner_user_name,
        u.email as owner_user_email
     from customers c
     join crm_users u on u.id = c.owner_id
     ${whereSql}
     order by c.created_at desc
     limit $${dataValues.length - 1} offset $${dataValues.length}`,
    dataValues
  );

  const count = await queryDb<{ total: string }>(
    `select count(*)::text as total from customers c ${whereSql}`,
    values
  );

  return {
    customers: data.rows.map(mapCustomerWithOwner),
    total: Number(count.rows[0]?.total ?? '0'),
  };
}

export async function insertCustomerWithOwner(input: {
  customerCode: string;
  name: string;
  contact: string;
  city: string | null;
  aiPurpose: string | null;
  ownerId: string;
}) {
  try {
    const result = await queryDb(
      `insert into customers (customer_code, name, contact, city, ai_purpose, owner_id)
       values ($1, $2, $3, $4, $5, $6)
       returning id`,
      [input.customerCode, input.name, input.contact, input.city, input.aiPurpose, input.ownerId]
    );

    if (!result.rows[0]?.id) {
      throw new Error('Insert customer failed');
    }

    return await getCustomerById(String(result.rows[0].id));
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
}

export async function insertCustomerWithOwnerForRetry(input: {
  customerCode: string;
  name: string;
  contact: string;
  city: string | null;
  aiPurpose: string | null;
  ownerId: string;
}) {
  const result = await queryDb(
    `insert into customers (customer_code, name, contact, city, ai_purpose, owner_id)
     values ($1, $2, $3, $4, $5, $6)
     returning id`,
    [input.customerCode, input.name, input.contact, input.city, input.aiPurpose, input.ownerId]
  );

  return getCustomerById(String(result.rows[0].id));
}

export async function getCustomerById(id: string) {
  const result = await queryDb(
    `select
        c.*,
        u.id as owner_user_id,
        u.name as owner_user_name,
        u.email as owner_user_email
     from customers c
     join crm_users u on u.id = c.owner_id
     where c.id = $1
     limit 1`,
    [id]
  );
  return result.rows[0] ? mapCustomerWithOwner(result.rows[0]) : null;
}

export async function updateCustomerById(input: {
  id: string;
  name: string;
  contact: string;
  city: string | null;
  aiPurpose: string | null;
}) {
  await queryDb(
    `update customers
     set name = $2, contact = $3, city = $4, ai_purpose = $5, updated_at = now()
     where id = $1`,
    [input.id, input.name, input.contact, input.city, input.aiPurpose]
  );

  return getCustomerById(input.id);
}

export async function updateCustomerFeishuRecordId(id: string, feishuRecordId: string) {
  await queryDb(
    `update customers set feishu_record_id = $2, updated_at = now() where id = $1`,
    [id, feishuRecordId]
  );
}

export async function getCustomerOwnerMeta(id: string) {
  const result = await queryDb<{ owner_id: string; feishu_record_id: string | null }>(
    `select owner_id, feishu_record_id from customers where id = $1 limit 1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function deleteCustomerById(id: string) {
  await queryDb(`delete from customers where id = $1`, [id]);
}

export async function listCommunicationsByCustomerId(customerId: string) {
  const result = await queryDb(
    `select
        c.*,
        u.id as comm_user_id,
        u.name as comm_user_name,
        u.email as comm_user_email
     from communications c
     join crm_users u on u.id = c.user_id
     where c.customer_id = $1
     order by c.created_at desc`,
    [customerId]
  );
  return result.rows.map(mapCommunicationWithUser);
}

export async function createCommunication(input: {
  customerId: string;
  userId: string;
  content: string;
  aiSummary?: string | null;
  aiNextAction?: string | null;
  aiFollowUpAt?: string | null;
  aiIntent?: string | null;
}) {
  const result = await queryDb(
    `insert into communications (customer_id, user_id, content, ai_summary, ai_next_action, ai_follow_up_at, ai_intent)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id`,
    [
      input.customerId,
      input.userId,
      input.content,
      input.aiSummary ?? null,
      input.aiNextAction ?? null,
      input.aiFollowUpAt ?? null,
      input.aiIntent ?? null,
    ]
  );

  const communicationId = String(result.rows[0].id);
  const full = await queryDb(
    `select
        c.*,
        u.id as comm_user_id,
        u.name as comm_user_name,
        u.email as comm_user_email
     from communications c
     join crm_users u on u.id = c.user_id
     where c.id = $1
     limit 1`,
    [communicationId]
  );
  return mapCommunicationWithUser(full.rows[0]);
}
